/**
 * @file main.c
 * @brief Implementation of RF spectrum analyzer using HackRF
 *
 * This application performs real-time RF spectrum analysis in the VHF band,
 * specifically monitoring the 88-108 MHz range. It uses HackRF One for signal
 * acquisition and implements signal processing algorithms for spectral analysis.
 * 
 * Features:
 * - Real-time signal acquisition using HackRF
 * - Welch's method for power spectral density estimation
 * - DC spike correction using dual acquisition technique
 * - Signal detection with configurable threshold
 * - JSON output for web interface visualization
 * - Support for both real-time and test modes
 */
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <signal.h>
#include <string.h>
#include <pthread.h>

#include "Drivers/bacn_RF.h"
#include "Modules/parameter.h"
#include "Modules/script_utils.h"
#include "Modules/CS8toIQ.h"
#include "Modules/welch.h"

#define TO_MHZ(val) ((val) * 1000000UL)

/* Define frequency ranges for VHF band scanning */
#define LOWER_FREQ_1    TO_MHZ(88)    /* Lower bound for first acquisition: 88MHz */
#define CENTRAL_FREQ_1  TO_MHZ(98)    /* Center frequency for first acquisition: 98MHz */
#define UPPER_FREQ_1    TO_MHZ(108)   /* Upper bound for first acquisition: 108MHz */

#define LOWER_FREQ_2    TO_MHZ(90)   /* Lower bound for second acquisition: 90MHz */
#define CENTRAL_FREQ_2  TO_MHZ(100)   /* Center frequency for second acquisition: 100MHz */
#define UPPER_FREQ_2    TO_MHZ(110)   /* Upper bound for second acquisition: 110MHz */

/* Spectral analysis configuration */
#define NPERSEG_LARGE   32768       /* High resolution for large-scale analysis */
#define NPERSEG_SMALL   4096        /* Low resolution for small-scale analysis */
#define THRESHOLD       -30         /* Signal detection threshold in dB */

/* DC spike correction configuration */
#define DC_CORRECTION_WIDTH 50      /* Number of points to correct on each side of DC spike */

/* Testing configuration */
#define TESTING_SAMPLES 1          /* Number of samples in TestingSamples directory */

/* Global state variables */
volatile sig_atomic_t running = 1;   /* Controls main processing loop */
bool testmode = false;               /* Enables test mode using pre-recorded samples */

/* Thread synchronization */
pthread_mutex_t mutex = PTHREAD_MUTEX_INITIALIZER;
pthread_cond_t sample2_processed = PTHREAD_COND_INITIALIZER;
bool sample2_ready = false;

WelchResult sample2_result;

/* Thread function for processing the second sample */
void* process_sample2(void* arg) {
    SignalProcessorConfig* config = (SignalProcessorConfig*)arg;
    
    /* Load IQ data from the input file */
    complex double* vector_IQ = NULL;
    size_t num_samples = 0;
    int error_code = 0;
    
    if (config->verbose_output) {
        printf("[Thread] Loading IQ data for sample 2...\n");
    }
    
    vector_IQ = load_iq_data(config->input_file_path, &num_samples, &error_code);
    if (vector_IQ == NULL) {
        fprintf(stderr, "[Thread] Error loading CS8 data: %s\n", cs8_iq_error_string(error_code));
        pthread_exit(NULL);
    }
    
    if (config->verbose_output) {
        printf("[Thread] Successfully loaded %zu samples for sample 2\n", num_samples);
    }
    
    /* Allocate memory for PSD and frequency arrays */
    sample2_result.nperseg_large = config->nperseg_large;
    sample2_result.nperseg_small = config->nperseg_small;
    sample2_result.central_freq = config->central_freq;
    
    sample2_result.psd_large = (double*)malloc(config->nperseg_large * sizeof(double));
    sample2_result.f_large = (double*)malloc(config->nperseg_large * sizeof(double));
    sample2_result.psd_small = (double*)malloc(config->nperseg_small * sizeof(double));
    sample2_result.f_small = (double*)malloc(config->nperseg_small * sizeof(double));
    
    if (sample2_result.psd_large == NULL || sample2_result.f_large == NULL || 
        sample2_result.psd_small == NULL || sample2_result.f_small == NULL) {
        fprintf(stderr, "[Thread] Memory allocation failed for sample 2 processing\n");
        free(vector_IQ);
        free(sample2_result.psd_large);
        free(sample2_result.f_large);
        free(sample2_result.psd_small);
        free(sample2_result.f_small);
        pthread_exit(NULL);
    }
    
    /* Calculate power spectral density with different resolutions */
    welch_psd_complex(vector_IQ, num_samples, 20000000, config->nperseg_large, 0, 
                     sample2_result.f_large, sample2_result.psd_large);
    welch_psd_complex(vector_IQ, num_samples, 20000000, config->nperseg_small, 0, 
                     sample2_result.f_small, sample2_result.psd_small);
    
    free(vector_IQ);
    
    /* Rearrange PSD arrays for proper visualization */
    if (!rearrange_welch_psd(sample2_result.psd_large, config->nperseg_large) || 
        !rearrange_welch_psd(sample2_result.psd_small, config->nperseg_small)) {
        fprintf(stderr, "[Thread] Error rearranging welch PSD for sample 2\n");
        free(sample2_result.psd_large);
        free(sample2_result.f_large);
        free(sample2_result.psd_small);
        free(sample2_result.f_small);
        pthread_exit(NULL);
    }
    
    /* Convert frequency arrays from relative to absolute frequencies */
    for (int i = 0; i < config->nperseg_large; i++) {
        sample2_result.f_large[i] = (sample2_result.f_large[i] + config->central_freq) / 1e6;
    }
    
    for (int i = 0; i < config->nperseg_small; i++) {
        sample2_result.f_small[i] = (sample2_result.f_small[i] + config->central_freq) / 1e6;
    }
    
    /* Signal that sample 2 processing is complete */
    pthread_mutex_lock(&mutex);
    sample2_ready = true;
    pthread_cond_signal(&sample2_processed);
    pthread_mutex_unlock(&mutex);
    
    if (config->verbose_output) {
        printf("[Thread] Sample 2 processing complete\n");
    }
    
    pthread_exit(NULL);
}

int main(void) {
    /* Initialize environment paths */
    env_path_t paths;
    get_paths(&paths);

    /* Log path configuration */
    printf("PATH: %s\n\r", paths.root_path);
    printf("PATH: %s\n\r", paths.core_samples_path);
    printf("PATH: %s\n\r", paths.core_json_path);
    strcat(paths.core_json_path, "/0");

    /* Initialize web interface */
    if (start_web(&paths) != 0) {
        fprintf(stderr, "[main] Error initializing Web Service\n");
        exit(EXIT_FAILURE);
    }

    /* Initialize frequency band configuration */
    int canalization_length;
    double canalization[250];    /* Array for channel center frequencies */
    double bandwidth[250];       /* Array for channel bandwidths */
    canalization_length = load_bands(canalization, bandwidth, &paths);

    /* Configure signal processing parameters for sample 1 */
    SignalProcessorConfig config1;
    memset(&config1, 0, sizeof(config1));
    config1.output_json_path = paths.core_json_path;
    config1.central_freq = CENTRAL_FREQ_1;
    config1.nperseg_large = NPERSEG_LARGE;
    config1.nperseg_small = NPERSEG_SMALL;
    config1.threshold = THRESHOLD;
    config1.verbose_output = true;
    config1.use_mmap = true;
    config1.canalization = canalization;
    config1.bandwidth = bandwidth;
    config1.canalization_length = canalization_length;
    config1.dc_correction_width = DC_CORRECTION_WIDTH;

    /* Configure signal processing parameters for sample 2 */
    SignalProcessorConfig config2;
    memset(&config2, 0, sizeof(config2));
    config2.central_freq = CENTRAL_FREQ_2;
    config2.nperseg_large = NPERSEG_LARGE;
    config2.nperseg_small = NPERSEG_SMALL;
    config2.verbose_output = true;
    config2.use_mmap = true;

    char input_file_path1[256];
    char input_file_path2[256];

    if (testmode) {
        /* Test mode: Process pre-recorded samples */
        while (1) {
            /* Reset sample2_ready flag */
            pthread_mutex_lock(&mutex);
            sample2_ready = false;
            pthread_mutex_unlock(&mutex);
            
            /* Set up file paths for both samples */
            snprintf(input_file_path1, sizeof(input_file_path1), 
                    "%sTestingSamples/%d", paths.core_samples_path, 0);
            snprintf(input_file_path2, sizeof(input_file_path2), 
                    "%sTestingSamples/%d", paths.core_samples_path, 1);
            
            config1.input_file_path = input_file_path1;
            config2.input_file_path = input_file_path2;
            
            /* Create thread to process sample 2 */
            pthread_t thread_id;
            if (pthread_create(&thread_id, NULL, process_sample2, &config2) != 0) {
                fprintf(stderr, "[main] Error creating thread for sample 2 processing\n");
                exit(EXIT_FAILURE);
            }
            
            /* Process sample 1 with DC spike correction using sample 2 */
            printf("[main] Processing sample 1 with DC spike correction\n");
            printf("[main] File: %s\n", input_file_path1);
            
            int result = process_signal_spectrum_with_correction(&config1, &sample2_result, &sample2_ready, 
                                                               &mutex, &sample2_processed);
            
            if (result != SP_SUCCESS) {
                fprintf(stderr, "[main] Error: %s\n", get_signal_processor_error(result));
                exit(EXIT_FAILURE);
            }
            
            /* Wait for sample 2 thread to complete */
            pthread_join(thread_id, NULL);
            
            /* Free sample 2 resources */
            free(sample2_result.psd_large);
            free(sample2_result.f_large);
            free(sample2_result.psd_small);
            free(sample2_result.f_small);
            
            printf("[main] SUCCESS: Both samples processed\n");
            
            /* In test mode, we'll just process once and exit */
            break;
        }
    } else {
        /* Real-time mode: Process live HackRF samples */
        int CS8Samples1, CS8Samples2;
        snprintf(input_file_path1, sizeof(input_file_path1), 
                "%s%d", paths.core_samples_path, 0);
        snprintf(input_file_path2, sizeof(input_file_path2), 
                "%s%d", paths.core_samples_path, 1);
        
        config1.input_file_path = input_file_path1;
        config2.input_file_path = input_file_path2;
        
        while (running) {
            /* Reset sample2_ready flag */
            pthread_mutex_lock(&mutex);
            sample2_ready = false;
            pthread_mutex_unlock(&mutex);

            /* Acquire first sample (88-108 MHz) as file "0" */
            printf("[main] Getting CS8 samples for range 1 (88-108 MHz) as file 0...\n");
            CS8Samples1 = getSamples(LOWER_FREQ_2, UPPER_FREQ_2);
            printf("[main] errno: %d\n", CS8Samples1);

            /* Rename file "0" to "1" */
            char file0_path[256];
            char file1_path[256];
            snprintf(file0_path, sizeof(file0_path), "%s0", paths.core_samples_path);
            snprintf(file1_path, sizeof(file1_path), "%s1", paths.core_samples_path);
            if (rename(file0_path, file1_path) != 0) {
                perror("[main] Error renaming file 0 to 1");
                exit(EXIT_FAILURE);
            }

            /* Acquire second sample (90-110 MHz) as file "0" */
            printf("[main] Getting CS8 samples for range 2 (90-110 MHz) as file 0...\n");
            CS8Samples2 = getSamples(LOWER_FREQ_1, UPPER_FREQ_1);
            printf("[main] errno: %d\n", CS8Samples2);

            /* Create thread to process sample 2 */
            pthread_t thread_id;
            if (pthread_create(&thread_id, NULL, process_sample2, &config2) != 0) {
                fprintf(stderr, "[main] Error creating thread for sample 2 processing\n");
                exit(EXIT_FAILURE);
            }

            /* Process sample 1 with DC spike correction using sample 2 */
            printf("[main] Processing sample 1 with DC spike correction\n");
            printf("[main] File: %s\n", input_file_path1);

            int result = process_signal_spectrum_with_correction(&config1, &sample2_result, &sample2_ready, 
                                                               &mutex, &sample2_processed);

            if (result != SP_SUCCESS) {
                fprintf(stderr, "[main] ERROR: %s\n", get_signal_processor_error(result));
                exit(EXIT_FAILURE);
            }

            /* Wait for sample 2 thread to complete */
            pthread_join(thread_id, NULL);

            /* Free sample 2 resources */
            free(sample2_result.psd_large);
            free(sample2_result.f_large);
            free(sample2_result.psd_small);
            free(sample2_result.f_small);

            printf("[main] SUCCESS: Both samples processed\n");
        }
    }

    /* Cleanup and shutdown */
    printf("[main] Stopping web service...\n");
    if (stop_web() != 0) {
        fprintf(stderr, "[main] Failed to stop the web process.\n");
        exit(EXIT_FAILURE);
    }

    /* Clean up thread resources */
    pthread_mutex_destroy(&mutex);
    pthread_cond_destroy(&sample2_processed);

    return 0;
}
