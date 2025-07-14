/**
 * @file parameter.c
 * @author Martin Ramirez Espinosa, David Ramírez Betancourth
 * * @brief Implementation of signal spectrum processing library
 * @ingroup signal_processor
 *
 * This file implements functions for analyzing signal spectrum data,
 * detecting transmissions in specified frequency channels, and generating
 * JSON output for visualization. The library supports both large-scale and
 * small-scale spectrum analysis with signal detection capabilities.
 *
 * Key features:
 * - Power spectral density (PSD) calculation using Welch's method
 * - Signal detection in specified frequency channels
 * - Spectrum visualization data generation
 * - JSON output for web interface integration
 * - Robust error handling and reporting
 */



#include "parameter.h"
#include <pthread.h>

static int find_closest_index(double* array, int length, double value) {
    int min_index = 0;
    double min_diff = fabs(array[0] - value);
    for (int i = 1; i < length; i++) {
        double diff = fabs(array[i] - value);
        if (diff < min_diff) {
            min_diff = diff;
            min_index = i;
        }
    }
    return min_index;
}

// Static helper function (Internal implementation detail)
static int compare_doubles(const void* a, const void* b) {
    double x = *(const double*)a;
    double y = *(const double*)b;
    
    if (x < y) return -1;
    else if (x > y) return 1;
    else return 0;
}

// Static helper function (Internal implementation detail)
static double calculate_median(const double* array, int start, int end) {
    if (array == NULL || start < 0 || end <= start) {
        return NAN;
    }
    
    int length = end - start;
    double* temp = (double*)malloc(length * sizeof(double));
    if (temp == NULL) {
        return NAN;
    }
    
    memcpy(temp, array + start, length * sizeof(double));
    
    qsort(temp, length, sizeof(double), compare_doubles);
    
    double median_value;
    if (length % 2 == 0) {
        median_value = (temp[length/2 - 1] + temp[length/2]) * 0.5;
    } else {
        median_value = temp[length/2];
    }
    
    free(temp);
    return median_value;
}

// Static helper function (Internal implementation detail)
static double find_min(const double* array, int length) {
    if (array == NULL || length <= 0) {
        return NAN;
    }
    
    double min_val = array[0];
    for (int i = 1; i < length; i++) {
        if (array[i] < min_val) {
            min_val = array[i];
        }
    }
    
    return min_val;
}

// Static helper function (Internal implementation detail)
static double find_max(const double* array, int start, int end) {
    if (array == NULL || start < 0 || end < start) {
        return NAN;
    }
    
    double max_val = array[start];
    for (int i = start + 1; i <= end; i++) {
        if (array[i] > max_val) {
            max_val = array[i];
        }
    }
    
    return max_val;
}

// Implementation for function declared in parameter.h
bool rearrange_welch_psd(double* psd, int length) {
    if (psd == NULL || length <= 0 || length % 2 != 0) {
        return false;
    }
    
    int half = length / 2;
    double* temp = (double*)malloc(length * sizeof(double));
    if (temp == NULL) {
        return false;
    }
    
    memcpy(temp, psd + half, half * sizeof(double));
    
    memcpy(temp + half, psd, half * sizeof(double));
    
    memcpy(psd, temp, length * sizeof(double));
    
    free(temp);
    return true;
}

// Static helper function (Internal implementation detail)
static bool apply_spectral_correction(double* psd, int length, int center_index, int correction_width) {
    if (psd == NULL || length <= 0 || center_index < 0 || center_index >= length || correction_width <= 0) {
        return false;
    }
    
    int b = center_index - (correction_width + 13);
    int a = center_index;
    
    for (int i = 0; i < correction_width; i++) {
        b = b - 3;
        if (b >= 0 && a >= 0 && a < length) {
            psd[a] = psd[b];
            a--;
        }
    }
    
    a = center_index;
    b = center_index - (correction_width + 13);
    for (int i = 0; i < correction_width; i++) {
        if (a < length && b >= 0 && b < length) {
            psd[a] = psd[b];
            a++;
            b -= 2;
        }
    }
    
    return true;
}

// Static helper function for advanced DC spike correction using second acquisition
static bool apply_dual_acquisition_correction(double* psd1, double* f1, int length1, 
                                            double* psd2, double* f2, int length2,
                                            double center_freq1, double center_freq2,
                                            int correction_width) {
    if (psd1 == NULL || f1 == NULL || length1 <= 0 || 
        psd2 == NULL || f2 == NULL || length2 <= 0 || 
        correction_width <= 0) {
        return false;
    }
    
    // Find the center frequency index in both arrays
    int center_index1 = -1;
    int center_index2 = -1;
    
    // Find the closest index to the center frequency in both arrays
    double min_diff1 = 1e9;
    double min_diff2 = 1e9;
    
    for (int i = 0; i < length1; i++) {
        double diff = fabs(f1[i] - center_freq1);
        if (diff < min_diff1) {
            min_diff1 = diff;
            center_index1 = i;
        }
    }
    
    for (int i = 0; i < length2; i++) {
        double diff = fabs(f2[i] - center_freq2);
        if (diff < min_diff2) {
            min_diff2 = diff;
            center_index2 = i;
        }
    }
    
    if (center_index1 < 0 || center_index2 < 0) {
        return false;
    }
    
    // Calculate the frequency step in both arrays
    double freq_step1 = (length1 > 1) ? fabs(f1[1] - f1[0]) : 0;
    double freq_step2 = (length2 > 1) ? fabs(f2[1] - f2[0]) : 0;
    
    if (freq_step1 <= 0 || freq_step2 <= 0) {
        return false;
    }
    
    // Calculate the number of points to correct on each side
    int points_to_correct = correction_width;
    
    // Replace the DC spike region in psd1 with corresponding values from psd2
    for (int i = -points_to_correct; i <= points_to_correct; i++) {
        int idx1 = center_index1 + i;
        
        if (idx1 >= 0 && idx1 < length1) {
            // Calculate the absolute frequency for this point
            double freq = f1[idx1];
            
            // Find the closest frequency in the second array
            int closest_idx2 = -1;
            double min_freq_diff = 1e9;
            
            for (int j = 0; j < length2; j++) {
                double diff = fabs(f2[j] - freq);
                if (diff < min_freq_diff) {
                    min_freq_diff = diff;
                    closest_idx2 = j;
                }
            }
            
            if (closest_idx2 >= 0 && closest_idx2 < length2) {
                // Aplicar un factor de corrección para ajustar los valores de magnitud
                // Calculamos la diferencia promedio entre los valores cercanos no afectados por el DC spike
                double correction_factor = 0.0;
                int num_samples = 0;
                
                // Tomamos muestras fuera de la región del DC spike para calcular el factor de corrección
                int sample_range = 10; // Número de muestras a considerar
                int start_sample = points_to_correct + 5; // Comenzamos justo después de la región del DC spike
                
                for (int k = 0; k < sample_range; k++) {
                    int sample_idx1 = center_index1 + start_sample + k;
                    if (sample_idx1 >= 0 && sample_idx1 < length1) {
                        // Encontrar la frecuencia correspondiente en el segundo array
                        double sample_freq = f1[sample_idx1];
                        int sample_idx2 = -1;
                        double min_sample_diff = 1e9;
                        
                        for (int j = 0; j < length2; j++) {
                            double diff = fabs(f2[j] - sample_freq);
                            if (diff < min_sample_diff) {
                                min_sample_diff = diff;
                                sample_idx2 = j;
                            }
                        }
                        
                        if (sample_idx2 >= 0 && sample_idx2 < length2) {
                            // Calcular la diferencia entre los valores de PSD
                            // Usamos valores logarítmicos para una mejor comparación
                            double psd1_db = 10.0 * log10(psd1[sample_idx1]);
                            double psd2_db = 10.0 * log10(psd2[sample_idx2]);
                            correction_factor += (psd1_db - psd2_db);
                            num_samples++;
                        }
                    }
                }
                
                // Calcular el factor de corrección promedio
                if (num_samples > 0) {
                    correction_factor /= num_samples;
                }
                
                // Aplicar el factor de corrección al valor de PSD2 antes de reemplazar
                double psd2_db = 10.0 * log10(psd2[closest_idx2]);
                double corrected_psd_db = psd2_db + correction_factor;
                double corrected_psd = pow(10.0, corrected_psd_db / 10.0);
                
                // Reemplazar el valor en psd1 con el valor corregido de psd2
                psd1[idx1] = corrected_psd;
            }
        }
    }
    
    return true;
}

// Static helper function (Internal implementation detail)
static cJSON* create_signal_json(
    const double* f, 
    const double* psd, 
    int length,
    double calibration_factor,
    const double* canalization,
    const double* bandwidth,
    int canalization_length,
    int threshold,
    double noise_floor
) {
    if (f == NULL || psd == NULL || length <= 0) {
        return NULL;
    }
    
    cJSON *json_root = cJSON_CreateObject();
    if (json_root == NULL) {
        return NULL;
    }
    
    cJSON_AddStringToObject(json_root, "band", "VHF");      
    cJSON_AddStringToObject(json_root, "fmin", "88");
    cJSON_AddStringToObject(json_root, "fmax", "108");
    cJSON_AddStringToObject(json_root, "units", "MHz");
    cJSON_AddStringToObject(json_root, "measure", "RMER");
    
    cJSON *json_vectors = cJSON_CreateObject();
    if (json_vectors == NULL) {
        cJSON_Delete(json_root);
        return NULL;
    }
    
    cJSON *json_psd_array = cJSON_CreateArray();
    if (json_psd_array == NULL) {
        cJSON_Delete(json_root);
        return NULL;
    }
    
    for (int i = 0; i < length; i++) {
        double adjusted_psd = 10.0 * log10(psd[i]) + calibration_factor;
        char buffer[32];
        snprintf(buffer, sizeof(buffer), "%.3f", adjusted_psd);
        cJSON_AddItemToArray(json_psd_array, cJSON_CreateNumber(atof(buffer)));
    }
    cJSON_AddItemToObject(json_vectors, "Pxx", json_psd_array);
    
    cJSON *json_f_array = cJSON_CreateArray();
    if (json_f_array == NULL) {
        cJSON_Delete(json_root);
        return NULL;
    }
    
    for (int i = 0; i < length; i++) {
        char buffer[32];
        snprintf(buffer, sizeof(buffer), "%.3f", f[i]);
        cJSON_AddItemToArray(json_f_array, cJSON_CreateNumber(atof(buffer)));
    }
    cJSON_AddItemToObject(json_vectors, "f", json_f_array);
    
    cJSON_AddItemToObject(json_root, "vectors", json_vectors);
    
    cJSON *json_params_array = cJSON_CreateArray();
    if (json_params_array != NULL) {
        cJSON_AddItemToObject(json_root, "parameters", json_params_array);
    }
    
    cJSON *json_data = cJSON_CreateObject();
    if (json_data == NULL) {
        cJSON_Delete(json_root);
        return NULL;
    }
    
    cJSON_AddItemToObject(json_data, "data", json_root);
    return json_data;
}

// Static helper function (Internal implementation detail)
static int save_json_to_file(const cJSON* json_obj, const char* filename) {
    if (json_obj == NULL || filename == NULL) {
        return SP_ERROR_NULL_POINTER;
    }
    
    char* json_string = cJSON_Print(json_obj);
    if (json_string == NULL) {
        return SP_ERROR_MEMORY_ALLOC;
    }
    
    FILE *file = fopen(filename, "w");
    if (file == NULL) {
        free(json_string);
        return SP_ERROR_FILE_IO;
    }
    
    size_t len = strlen(json_string);
    size_t written = fwrite(json_string, 1, len, file);
    
    fclose(file);
    free(json_string);
    
    return (written == len) ? SP_SUCCESS : SP_ERROR_FILE_IO;
}

// Implementation for function declared in parameter.h
int process_signal_spectrum_with_correction(const SignalProcessorConfig* config, 
                                          void* sample2_result_void, 
                                          bool* sample2_ready,
                                          pthread_mutex_t* mutex,
                                          pthread_cond_t* cond) {
    if (config == NULL || config->input_file_path == NULL || 
        config->output_json_path == NULL || config->canalization == NULL || 
        config->bandwidth == NULL || config->canalization_length <= 0 ||
        sample2_result_void == NULL || sample2_ready == NULL ||
        mutex == NULL || cond == NULL) {
        return SP_ERROR_NULL_POINTER;
    }
    
    WelchResult* sample2_result = (WelchResult*)sample2_result_void;
    
    complex double* vector_IQ = NULL;
    double* psd_large = NULL;
    double* f_large = NULL;
    double* psd_small = NULL;
    double* f_small = NULL;
    size_t num_samples = 0;
    int error_code = 0;
    int result = SP_SUCCESS;
    
    int nperseg_large = config->nperseg_large > 0 ? config->nperseg_large : 32768;
    int nperseg_small = config->nperseg_small > 0 ? config->nperseg_small : 4096;
    int dc_correction_width = config->dc_correction_width > 0 ? config->dc_correction_width : 50;
    
    if (nperseg_large % 2 != 0 || nperseg_small % 2 != 0) {
        return SP_ERROR_INVALID_PARAMETER;
    }
    
    clock_t start_time = 0, end_time = 0;
    if (config->verbose_output) {
        start_time = clock();
        printf("[params] Starting signal processing with DC spike correction...\n");
    }
    
    // Load IQ data from the input file
    vector_IQ = load_iq_data(config->input_file_path, &num_samples, &error_code);
    if (vector_IQ == NULL) {
        fprintf(stderr, "[params] Error loading CS8 data: %s\n", cs8_iq_error_string(error_code));
        return SP_ERROR_FILE_IO;
    }
    
    if (config->verbose_output) {
        printf("[params] Successfully loaded %zu samples\n", num_samples);
    }
    
    // Allocate memory for PSD and frequency arrays
    psd_large = (double*)malloc(nperseg_large * sizeof(double));
    f_large = (double*)malloc(nperseg_large * sizeof(double));
    psd_small = (double*)malloc(nperseg_small * sizeof(double));
    f_small = (double*)malloc(nperseg_small * sizeof(double));
    
    if (psd_large == NULL || f_large == NULL || psd_small == NULL || f_small == NULL) {
        result = SP_ERROR_MEMORY_ALLOC;
        goto cleanup;
    }
    
    // Calculate power spectral density with different resolutions
    welch_psd_complex(vector_IQ, num_samples, 20000000, nperseg_large, 0, f_large, psd_large);
    welch_psd_complex(vector_IQ, num_samples, 20000000, nperseg_small, 0, f_small, psd_small);
    
    free(vector_IQ);
    vector_IQ = NULL;
    
    // Rearrange PSD arrays for proper visualization
    if (!rearrange_welch_psd(psd_large, nperseg_large) || 
        !rearrange_welch_psd(psd_small, nperseg_small)) {
        result = SP_ERROR_MEMORY_ALLOC;
        goto cleanup;
    }
    
    // Wait for sample 2 processing to complete
    if (config->verbose_output) {
        printf("[params] Waiting for sample 2 processing to complete...\n");
    }
    
    pthread_mutex_lock(mutex);
    while (!(*sample2_ready)) {
        pthread_cond_wait(cond, mutex);
    }
    pthread_mutex_unlock(mutex);
    
    if (config->verbose_output) {
        printf("[params] Sample 2 processing complete, applying DC spike correction...\n");
    }
    
    // Apply DC spike correction using sample 2 data
    // Convert frequency arrays from relative to absolute frequencies first
    for (int i = 0; i < nperseg_large; i++) {
        f_large[i] = (f_large[i] + config->central_freq) / 1e6;
    }
    
    for (int i = 0; i < nperseg_small; i++) {
        f_small[i] = (f_small[i] + config->central_freq) / 1e6;
    }
    
    // Apply dual acquisition correction
    if (!apply_dual_acquisition_correction(
            psd_large, f_large, nperseg_large,
            sample2_result->psd_large, sample2_result->f_large, sample2_result->nperseg_large,
            config->central_freq / 1e6, sample2_result->central_freq / 1e6,
            dc_correction_width)) {
        fprintf(stderr, "[params] Warning: Failed to apply DC spike correction to large PSD\n");
    }
    
    if (!apply_dual_acquisition_correction(
            psd_small, f_small, nperseg_small,
            sample2_result->psd_small, sample2_result->f_small, sample2_result->nperseg_small,
            config->central_freq / 1e6, sample2_result->central_freq / 1e6,
            dc_correction_width)) {
        fprintf(stderr, "[params] Warning: Failed to apply DC spike correction to small PSD\n");
    }
    
    // Calculate calibration factor between large and small PSDs
    double constante = fabs(fabs(10 * log10(psd_large[0])) - fabs(10 * log10(psd_small[0])));
    
    // Find noise floor
    float noise = find_min(psd_large, nperseg_large);
    
    int N_f = nperseg_large;
    bool signal_detected = false;
    
    // Check each channel for signal presence
    for (int idx = 0; idx < config->canalization_length; idx++) {
        double center_freq = config->canalization[idx];
        double bw = config->bandwidth[idx];
        
        double target_lower_freq = center_freq - bw / 2;
        double target_upper_freq = center_freq + bw / 2;
        
        int lower_index = find_closest_index(f_large, N_f, target_lower_freq);
        int upper_index = find_closest_index(f_large, N_f, target_upper_freq);
        
        if (lower_index > upper_index) {
            int temp = lower_index;
            lower_index = upper_index;
            upper_index = temp;
        }
        
        if (lower_index < 0) lower_index = 0;
        if (upper_index >= N_f) upper_index = N_f - 1;
        
        int range_length = upper_index - lower_index + 1;
        
        if (range_length > 0) {
            double power_max = find_max(psd_large, lower_index, upper_index);
            double power = calculate_median(psd_large, lower_index, upper_index);
            double snr = 10.0 * log10(power_max / noise);
            
            if (10.0 * log10(power_max) > config->threshold) {
                signal_detected = true;
            }
        }
    }
    
    // Create JSON representation of signal data
    cJSON *json_data = create_signal_json(
        f_small,
        psd_small,
        nperseg_small,
        constante,
        config->canalization,
        config->bandwidth,
        config->canalization_length,
        config->threshold,
        noise
    );
    
    if (json_data == NULL) {
        result = SP_ERROR_MEMORY_ALLOC;
        goto cleanup;
    }
    
    // Save JSON to output file
    result = save_json_to_file(json_data, config->output_json_path);
    cJSON_Delete(json_data);
    
    if (config->verbose_output) {
        end_time = clock();
        double processing_time = ((double)(end_time - start_time)) / CLOCKS_PER_SEC;
        printf("[params] Processing completed in %.3f seconds\n", processing_time);
        printf("[params] Signal %s\n", signal_detected ? "DETECTED" : "NOT DETECTED");
    }
    
cleanup:
    free(psd_large);
    free(f_large);
    free(psd_small);
    free(f_small);
    free(vector_IQ); 
    
    return result;
}

// Implementation for function declared in parameter.h
int process_signal_spectrum(const SignalProcessorConfig* config) {
    if (config == NULL || config->input_file_path == NULL || 
        config->output_json_path == NULL || config->canalization == NULL || 
        config->bandwidth == NULL || config->canalization_length <= 0) {
        return SP_ERROR_NULL_POINTER;
    }
    
    complex double* vector_IQ = NULL;
    double* psd_large = NULL;
    double* f_large = NULL;
    double* psd_small = NULL;
    double* f_small = NULL;
    size_t num_samples = 0;
    int error_code = 0;
    int result = SP_SUCCESS;
    
    int nperseg_large = config->nperseg_large > 0 ? config->nperseg_large : 32768;
    int nperseg_small = config->nperseg_small > 0 ? config->nperseg_small : 4096;
    
    if (nperseg_large % 2 != 0 || nperseg_small % 2 != 0) {
        return SP_ERROR_INVALID_PARAMETER;
    }
    
    clock_t start_time = 0, end_time = 0;
    if (config->verbose_output) {
        start_time = clock();
        printf("[params] Starting signal processing...\n");
    }
    
    // Load IQ data from the input file
    vector_IQ = load_iq_data(config->input_file_path, &num_samples, &error_code);
    if (vector_IQ == NULL) {
        fprintf(stderr, "[params] Error loading CS8 data: %s\n", cs8_iq_error_string(error_code));
        return SP_ERROR_FILE_IO;
    }
    
    if (config->verbose_output) {
        printf("[params] Successfully loaded %zu samples\n", num_samples);
    }
    
    // Allocate memory for PSD and frequency arrays
    psd_large = (double*)malloc(nperseg_large * sizeof(double));
    f_large = (double*)malloc(nperseg_large * sizeof(double));
    psd_small = (double*)malloc(nperseg_small * sizeof(double));
    f_small = (double*)malloc(nperseg_small * sizeof(double));
    
    if (psd_large == NULL || f_large == NULL || psd_small == NULL || f_small == NULL) {
        result = SP_ERROR_MEMORY_ALLOC;
        goto cleanup;
    }
    
    // Calculate power spectral density with different resolutions
    welch_psd_complex(vector_IQ, num_samples, 20000000, nperseg_large, 0, f_large, psd_large);
    welch_psd_complex(vector_IQ, num_samples, 20000000, nperseg_small, 0, f_small, psd_small);
    
    free(vector_IQ);
    vector_IQ = NULL;
    
    // Rearrange PSD arrays for proper visualization
    if (!rearrange_welch_psd(psd_large, nperseg_large) || 
        !rearrange_welch_psd(psd_small, nperseg_small)) {
        result = SP_ERROR_MEMORY_ALLOC;
        goto cleanup;
    }
    
    // Apply spectral correction to remove DC spike artifacts
    int center_large = nperseg_large / 2;
    int count_large = (int)(nperseg_large * 0.002);
    int center_small = nperseg_small / 2;
    int count_small = (int)(nperseg_small * 0.002);
    
    apply_spectral_correction(psd_large, nperseg_large, center_large, count_large);
    apply_spectral_correction(psd_small, nperseg_small, center_small, count_small);
    
    // Convert frequency arrays from relative to absolute frequencies
    for (int i = 0; i < nperseg_large; i++) {
        f_large[i] = (f_large[i] + config->central_freq) / 1e6;
    }
    
    for (int i = 0; i < nperseg_small; i++) {
        f_small[i] = (f_small[i] + config->central_freq) / 1e6;
    }
    
    // Calculate calibration factor between large and small PSDs
    double constante = fabs(fabs(10 * log10(psd_large[0])) - fabs(10 * log10(psd_small[0])));
    
    // Find noise floor
    float noise = find_min(psd_large, nperseg_large);
    
    int N_f = nperseg_large;
    bool signal_detected = false;
    
    // Check each channel for signal presence
    for (int idx = 0; idx < config->canalization_length; idx++) {
        double center_freq = config->canalization[idx];
        double bw = config->bandwidth[idx];
        
        double target_lower_freq = center_freq - bw / 2;
        double target_upper_freq = center_freq + bw / 2;
        
        int lower_index = find_closest_index(f_large, N_f, target_lower_freq);
        int upper_index = find_closest_index(f_large, N_f, target_upper_freq);
        
        if (lower_index > upper_index) {
            int temp = lower_index;
            lower_index = upper_index;
            upper_index = temp;
        }
        
        if (lower_index < 0) lower_index = 0;
        if (upper_index >= N_f) upper_index = N_f - 1;
        
        int range_length = upper_index - lower_index + 1;
        
        if (range_length > 0) {
            double power_max = find_max(psd_large, lower_index, upper_index);
            double power = calculate_median(psd_large, lower_index, upper_index);
            double snr = 10.0 * log10(power_max / noise);
            
            if (10.0 * log10(power_max) > config->threshold) {
                signal_detected = true;
            }
        }
    }
    
    // Create JSON representation of signal data
    cJSON *json_data = create_signal_json(
        f_small,
        psd_small,
        nperseg_small,
        constante,
        config->canalization,
        config->bandwidth,
        config->canalization_length,
        config->threshold,
        noise
    );
    
    if (json_data == NULL) {
        result = SP_ERROR_MEMORY_ALLOC;
        goto cleanup;
    }
    
    // Save JSON to output file
    result = save_json_to_file(json_data, config->output_json_path);
    cJSON_Delete(json_data);
    
    if (config->verbose_output) {
        end_time = clock();
        double processing_time = ((double)(end_time - start_time)) / CLOCKS_PER_SEC;
        printf("[params] Processing completed in %.3f seconds\n", processing_time);
        printf("[params] Signal %s\n", signal_detected ? "DETECTED" : "NOT DETECTED");
    }
    
cleanup:
    free(psd_large);
    free(f_large);
    free(psd_small);
    free(f_small);
    free(vector_IQ); 
    
    return result;
}

// Implementation for function declared in parameter.h
const char* get_signal_processor_error(int error_code) {
    switch (error_code) {
        case SP_SUCCESS:
            return "Success";
        case SP_ERROR_NULL_POINTER:
            return "Null pointer provided";
        case SP_ERROR_MEMORY_ALLOC:
            return "Memory allocation failed";
        case SP_ERROR_FILE_IO:
            return "File I/O error";
        case SP_ERROR_INVALID_PARAMETER:
            return "Invalid parameter";
        case SP_ERROR_DATA_PROCESSING:
            return "Data processing error";
        default:
            return "Unknown error";
    }
}