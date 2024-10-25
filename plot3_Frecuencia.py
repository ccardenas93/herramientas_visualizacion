# Creating a clean script for generating the travel_frequency.json file from the user's dataset

import pandas as pd
import json

# Load the user's file to inspect its contents
file_path = 'data/public_transportation_data.csv'
data = pd.read_csv(file_path)

# Ensure the date columns are in datetime format
data['start_date'] = pd.to_datetime(data['start_date'])

# Extract hour from start_date for the frequency plot
data['start_hour'] = data['start_date'].dt.hour

# Creating a JSON file for Travel Frequency by Time of Day
# Extracting the necessary data for the plot
travel_frequency_data = data['start_hour'].value_counts().sort_index()

# Creating a dictionary for the JSON structure
travel_frequency_json = [{"hour": int(hour), "frequency": int(freq)} for hour, freq in travel_frequency_data.items()]

# Saving the data to a JSON file
json_path = 'data/travel_frequency.json'

with open(json_path, 'w') as json_file:
    json.dump(travel_frequency_json, json_file)

# Display the path of the JSON file
json_path
