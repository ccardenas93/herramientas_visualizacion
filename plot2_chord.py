import pandas as pd
import json

# Cargar el archivo CSV en un DataFrame de pandas
data = pd.read_csv('data/public_transportation_data.csv')

# Asegurarse de que las columnas 'origin' y 'destination' sean de tipo cadena y eliminar espacios en blanco
data['origin'] = data['origin'].astype(str).str.strip()
data['destination'] = data['destination'].astype(str).str.strip()

# Obtener la lista de ciudades únicas
ciudades = list(set(data['origin'].unique()).union(set(data['destination'].unique())))

# Crear un mapeo de ciudades a índices
indice_ciudad = {ciudad: idx for idx, ciudad in enumerate(ciudades)}

# Inicializar una matriz cuadrada con ceros
tamaño_matriz = len(ciudades)
matriz = [[0 for _ in range(tamaño_matriz)] for _ in range(tamaño_matriz)]

# Contar el número de viajes entre cada par de ciudades
for _, fila in data.iterrows():
    origen = fila['origin']
    destino = fila['destination']
    i = indice_ciudad[origen]
    j = indice_ciudad[destino]
    matriz[i][j] += 1  # Incrementar el contador de viajes de origen a destino

# Preparar los datos para el JSON
datos_acordes = {
    'ciudades': ciudades,
    'matriz': matriz
}

# Guardar los datos en un archivo JSON
with open('data/datos_acordes.json', 'w') as f:
    json.dump(datos_acordes, f, ensure_ascii=False)

print('El archivo JSON para el gráfico de acordes ha sido creado.')
