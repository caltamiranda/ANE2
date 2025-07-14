import os
import json
import numpy as np
from scipy import stats
import pandas as pd
import sys


def load_signals_from_folder(folder_path, VERBOSE=False):
    """
    Loads Pxx data from JSON files in a specified folder and returns them as a NumPy array.

    Args:
        folder_path (str): The path to the folder containing the JSON files.
        VERBOSE (bool): If True, prints verbose output during processing.

    Returns:
        numpy.ndarray: A 2D NumPy array where each row is the Pxx array from a file.
                       Returns an empty NumPy array if no files are found or an error occurs.
    """
    pxx_data_list = []
    file_list = []

    for root, dirs, files in os.walk(folder_path):
        for file in files:
            file_list.append(file)

    if VERBOSE:
        print(f"File list: {file_list}\n")

    for file_name in file_list:
        file_path = os.path.join(folder_path, file_name)

        if VERBOSE:
            print(f"Processing: {file_path}")

        try:
            with open(file_path, 'r') as f:
                data = json.load(f)

                if VERBOSE:
                    print(f"Loaded data for {file_name}: {data}")

                lvl_key = data.get("data", {}).get("vectors", {})
                pxx_data = lvl_key.get("Pxx")

                if pxx_data is not None:
                    pxx_data_list.append(np.array(pxx_data)) # Convert to NumPy array
                else:
                    if VERBOSE:
                        print(f"Warning: 'Pxx' not found in {file_name}")

        except json.JSONDecodeError as e:
            if VERBOSE:
                print(f"Error decoding JSON from {file_name}: {e}")
        except FileNotFoundError:
            if VERBOSE:
                print(f"Error: File not found at {file_path}")
        except Exception as e:
            if VERBOSE:
                print(f"An unexpected error occurred with {file_name}: {e}")

    print("Parse Done...")

    if pxx_data_list:
        # Stack the arrays vertically to create a 2D matrix
        return np.vstack(pxx_data_list)

    else:
        return np.array([]) # Return an empty NumPy array if no data
    
def exec_anova(dev1_data, dev2_data):
    data1_class = np.concatenate(dev1_data)
    data2_class = np.concatenate(dev2_data)

    f_stat, p_val = stats.f_oneway(data1_class, data2_class)

    data1_stats = [np.mean(data1_class), np.std(data1_class), np.min(data1_class), np.max(data1_class)]
    data2_stats = [np.mean(data2_class), np.std(data2_class), np.min(data2_class), np.max(data2_class)]

    print("Anova Done...")

    return f_stat, p_val, data1_stats, data2_stats

def export_to_excel(dev1_matrix, dev2_matrix, output_filename='resultados_anova.xlsx'):
    f_stat, p_val, dev1_stats, dev2_stats = exec_anova(dev1_matrix, dev2_matrix)

    # Definir etiquetas para las estadísticas
    stats_labels = ['Media', 'Desviación estándar', 'Mínimo', 'Máximo', 'F-statistic', 'P-value']

    # Agregar los valores de ANOVA al final de cada lista
    dev1_stats.extend(['', ''])  # Vacío en lugar de f-stat y p-val
    dev2_stats.extend(['', ''])
    anova_stats = ['', '', '', '', f_stat, p_val]

    # Crear DataFrame
    df = pd.DataFrame({
        'Estadística': stats_labels,
        'Dispositivo 1': dev1_stats,
        'Dispositivo 2': dev2_stats,
        'ANOVA': anova_stats
    })

    # Exportar a Excel
    df.to_excel(output_filename, index=False)
    print(f"Resultados exportados a {output_filename}")


    

    



















if len(sys.argv) != 3:
    print("Usage: python anova-script.py <folder1> <folder2>")
    sys.exit(1)

def main(dev1_path, dev2_path):
    device1_signals_matrix = load_signals_from_folder(dev1_path)
    device2_signals_matrix = load_signals_from_folder(dev2_path)

    export_to_excel(device1_signals_matrix, device2_signals_matrix)



main(sys.argv[1], sys.argv[2])