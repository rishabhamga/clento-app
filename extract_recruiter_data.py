#!/usr/bin/env python3
"""
Script to extract recruiter data from people_data.md and create a CSV file
with fields: name, company, linkedin_url
"""

import json
import csv
import sys

def extract_recruiter_data(input_file, output_file):
    """
    Extract name, company, and LinkedIn URL from JSON data and save to CSV
    """
    try:
        # Read the JSON data from the markdown file
        with open(input_file, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Clean the content - remove any trailing characters after the JSON
        content = content.strip()
        
        # Find the last closing brace to truncate any extra content
        last_brace = content.rfind('}')
        if last_brace != -1:
            content = content[:last_brace + 1]
            
        # Parse the JSON data
        data = json.loads(content)
        
        # Extract the people array
        people = data.get('people', [])
        
        if not people:
            print("No people data found in the file")
            return
            
        # Prepare CSV data
        csv_data = []
        
        for person in people:
            name = person.get('name', '')
            company = ''
            linkedin_url = person.get('linkedin_url', '')
            
            # Get company name from organization object
            organization = person.get('organization', {})
            if organization:
                company = organization.get('name', '')
            
            # Only add if we have at least a name
            if name:
                csv_data.append({
                    'name': name,
                    'company': company,
                    'linkedin_url': linkedin_url
                })
        
        # Write to CSV file
        with open(output_file, 'w', newline='', encoding='utf-8') as csvfile:
            fieldnames = ['name', 'company', 'linkedin_url']
            writer = csv.DictWriter(csvfile, fieldnames=fieldnames)
            
            # Write header
            writer.writeheader()
            
            # Write data rows
            for row in csv_data:
                writer.writerow(row)
                
        print(f"Successfully extracted {len(csv_data)} records to {output_file}")
        
        # Display first few records as preview
        print("\nFirst 5 records:")
        print("-" * 80)
        for i, record in enumerate(csv_data[:5]):
            print(f"{i+1}. Name: {record['name']}")
            print(f"   Company: {record['company']}")
            print(f"   LinkedIn: {record['linkedin_url']}")
            print()
            
    except json.JSONDecodeError as e:
        print(f"Error parsing JSON: {e}")
    except FileNotFoundError:
        print(f"File {input_file} not found")
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    input_file = "people_data.md"
    output_file = "recruiters_data.csv"
    
    print(f"Extracting recruiter data from {input_file}...")
    extract_recruiter_data(input_file, output_file) 