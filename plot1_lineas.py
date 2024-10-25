import pandas as pd
import json

# Cargar el archivo CSV
file_path = 'data/public_transportation_data.csv'
data = pd.read_csv(file_path)

# Procesar los datos para extraer mes-año de la columna start_date
data['start_month'] = pd.to_datetime(data['start_date']).dt.to_period('M').astype(str)

# Agrupar por ruta y clase de tren y calcular el precio promedio mensual
route_class_avg = data.groupby(['origin', 'destination', 'train_class', 'start_month']).agg(avg_price=('price', 'mean')).reset_index()

# Crear una columna de ruta combinando origin y destination
route_class_avg['route'] = route_class_avg['origin'] + '-' + route_class_avg['destination']

# Reorganizar los datos para el formato JSON
json_data = []
for _, row in route_class_avg.iterrows():
    json_data.append({
        'route': row['route'],
        'class': row['train_class'],
        'month': row['start_month'],
        'avg_price': row['avg_price']
    })

# Guardar los datos en un archivo JSON
json_file_path = 'data/route_class_avg_data_clean.json'
with open(json_file_path, 'w') as f:
    json.dump(json_data, f)

json_file_path
