/**
 * @file parameter.h
 * @author Martin Ramirez Espinosa, David Ramírez Betancourth
 * @brief Signal spectrum processing library interface
 * @ingroup signal_processor
 *
 * Defines types and function prototypes for:
 * - Configuring spectrum analysis parameters
 * - Processing signal data to detect transmissions
 * - Generating JSON output for visualization
 * - Reporting errors in a structured manner
 */

#ifndef SIGNAL_PROCESSOR_H
#define SIGNAL_PROCESSOR_H

#include <stdint.h>
#include <stdbool.h>
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <complex.h>
#include <time.h>
#include <unistd.h>
#include <errno.h>
#include "../Modules/CS8toIQ.h"

#include "../Modules/welch.h"
#include "../Modules/cJSON.h"
/**
 * @enum SPErrorCode
 * @brief Error codes returned by signal processing functions
 *
 * Provides detailed status of operations:
 * - SP_SUCCESS: Operation succeeded
 * - SP_ERROR_NULL_POINTER: A required pointer was NULL
 * - SP_ERROR_MEMORY_ALLOC: Memory allocation failed
 * - SP_ERROR_FILE_IO: File input/output failure
 * - SP_ERROR_INVALID_PARAMETER: Invalid argument provided
 * - SP_ERROR_DATA_PROCESSING: Error during data analysis
 */
typedef enum {
    SP_SUCCESS                 =  0, /**< Success */
    SP_ERROR_NULL_POINTER      = -1, /**< Null pointer argument */
    SP_ERROR_MEMORY_ALLOC      = -2, /**< Allocation failure */
    SP_ERROR_FILE_IO           = -3, /**< File I/O error */
    SP_ERROR_INVALID_PARAMETER = -4, /**< Invalid parameter */
    SP_ERROR_DATA_PROCESSING   = -5  /**< Data processing error */
} SPErrorCode;

/**
 * @struct SignalProcessorConfig
 * @brief Configuration for spectrum processing
 *
 * Holds all parameters required to perform spectrum analysis:
 * - input_file_path: Path to the raw signal data file
 * - central_freq:    Center frequency in Hertz
 * - nperseg_large:   Segment size for coarse analysis
 * - nperseg_small:   Segment size for fine analysis
 * - threshold:       Detection threshold in dB
 * - canalization:    Array of channel center frequencies (MHz)
 * - bandwidth:       Array of channel bandwidths (MHz)
 * - canalization_length: Number of channels defined
 * - output_json_path: Path where JSON results will be written
 * - use_mmap:        Enable memory-mapped file access
 * - verbose_output:  Enable detailed console logging
 * - dc_correction_width: Number of points to correct on each side of DC spike
 */
typedef struct {
    const char* input_file_path;
    uint64_t    central_freq;
    int         nperseg_large;
    int         nperseg_small;
    int         threshold;
    double*     canalization;
    double*     bandwidth;
    int         canalization_length;
    const char* output_json_path;
    bool        use_mmap;
    bool        verbose_output;
    int         dc_correction_width;
} SignalProcessorConfig;

// Forward declaration of the WelchResult structure from main.c
typedef struct {
    double* f_large;
    double* psd_large;
    double* f_small;
    double* psd_small;
    int nperseg_large;
    int nperseg_small;
    double central_freq;
} WelchResult;

/**
 * @brief Finds the index of the element in the array that is closest to a given value.
 *
 * This function iterates through an array of double-precision floating-point numbers (`double`)
 * and calculates the absolute difference between each element and the target value `value`.
 * It returns the index of the element whose difference is the smallest.
 *
 * @param array A pointer to the array of `double` values.
 * @param length The number of elements in the array.
 * @param value The value to which the closest element is to be found.
 *
 * @return The index of the element in the array that is closest to the given value `value`.
 *
 * @note If the array contains multiple elements at the same distance from `value`,
 * the function returns the index of the first element found.
 *
 * @example
 * @code
 * double array[] = {1.2, 3.4, 5.6, 7.8};
 * int closest_index = find_closest_index(array, 4, 4.0);
 * // closest_index will be 1, since 3.4 is the value closest to 4.0 in the array.
 * @endcode
 */
//int find_closest_index(double* array, int length, double value);

/**
 * @brief Analyze signal spectrum and produce JSON output.
 *
 * Processes input data according to the provided configuration:
 * 1. Reads the signal file (optionally via mmap)
 * 2. Splits data into overlapping segments
 * 3. Computes spectral power and applies thresholding
 * 4. Detects active channels and timestamps
 * 5. Writes results to a JSON file
 *
 * @param config Pointer to a fully populated SignalProcessorConfig
 * @return SP_SUCCESS on success, or an SPErrorCode on failure
 */
int process_signal_spectrum(const SignalProcessorConfig* config);

/**
 * @brief Rearrange Welch PSD data for proper visualization.
 *
 * Rearranges the PSD data to shift the zero frequency to the center.
 *
 * @param psd Array of PSD values to rearrange
 * @param length Length of the PSD array
 * @return true on success, false on failure
 */
bool rearrange_welch_psd(double* psd, int length);

/**
 * @brief Analyze signal spectrum with DC spike correction using a second acquisition.
 *
 * Processes input data with enhanced DC spike correction:
 * 1. Reads the signal file and performs Welch's method
 * 2. Waits for the second acquisition to be processed
 * 3. Uses data from the second acquisition to correct the DC spike in the first
 * 4. Continues with normal signal processing and JSON output
 *
 * @param config Pointer to a fully populated SignalProcessorConfig for the first acquisition
 * @param sample2_result Pointer to the Welch result structure from the second acquisition
 * @param sample2_ready Pointer to a flag indicating if the second acquisition is processed
 * @param mutex Pointer to a mutex for thread synchronization
 * @param cond Pointer to a condition variable for thread synchronization
 * @return SP_SUCCESS on success, or an SPErrorCode on failure
 */
int process_signal_spectrum_with_correction(const SignalProcessorConfig* config, 
                                          void* sample2_result, 
                                          bool* sample2_ready,
                                          pthread_mutex_t* mutex,
                                          pthread_cond_t* cond);

/**
 * @brief Retrieve a human-readable message for an error code.
 *
 * Maps SPErrorCode values to descriptive strings:
 * e.g., SP_ERROR_FILE_IO → "File input/output error"
 *
 * @param error_code Numeric error code returned by library functions
 * @return Constant string describing the error
 */
const char* get_signal_processor_error(int error_code);

#endif // SIGNAL_PROCESSOR_H
