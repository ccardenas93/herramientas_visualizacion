import pandas as pd

# Cargar los datos originales
data = pd.read_csv('data/public_transportation_data.csv')

# Asegurarnos de que las columnas 'origin' y 'destination' sean de tipo cadena y eliminar espacios en blanco
data['origin'] = data['origin'].astype(str).str.strip()
data['destination'] = data['destination'].astype(str).str.strip()

# Contar el número de viajes entre cada par de ciudades
conexiones = data.groupby(['origin', 'destination']).size().reset_index(name='count')

# Guardar las conexiones en un archivo CSV
conexiones.to_csv('data/conexiones_ciudades.csv', index=False)
