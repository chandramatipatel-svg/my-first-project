from flask import Flask, request, jsonify
from flask_cors import CORS
import tempfile
import os
import subprocess
import json

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

def run_pylint(code_string):
    # Save code to a temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
        temp_file.write(code_string)
        temp_file_path = temp_file.name

    try:
        # Run pylint on the temporary file, outputting JSON
        result = subprocess.run(
            ['pylint', temp_file_path, '--output-format=json'],
            capture_output=True,
            text=True
        )
        
        # Pylint exits with non-zero code if it finds issues, so we just read stdout
        output_json = result.stdout
        
        if not output_json.strip():
            return []
            
        pylint_results = json.loads(output_json)
        
        # Translate pylint output into beginner-friendly format
        issues = []
        for issue in pylint_results:
            msg_type = 'info'
            if issue['type'] == 'error' or issue['type'] == 'fatal':
                msg_type = 'error'
            elif issue['type'] == 'warning':
                msg_type = 'warning'
                
            issues.append({
                'type': msg_type,
                'message': issue['message'],
                'line': issue['line'],
                'symbol': issue['symbol'],
                'message_id': issue['message-id']
            })
            
        return issues
        
    except Exception as e:
        print(f"Error running pylint: {e}")
        return []
        
    finally:
        # Clean up temp file
        if os.path.exists(temp_file_path):
            os.remove(temp_file_path)

@app.route('/analyze-code', methods=['POST'])
def analyze_code():
    data = request.json
    if not data or 'code' not in data:
        return jsonify({'error': 'No code provided'}), 400
        
    code = data['code']
    language = data.get('language', 'python')
    
    if language != 'python':
        return jsonify({'error': f'Language {language} is not supported yet. Please use Python.'}), 400
        
    # Analyze with pylint
    issues = run_pylint(code)
    
    # Calculate a simple score based on number of issues
    base_score = 100
    deduction = len(issues) * 5
    final_score = max(0, base_score - deduction)
    
    # Dummy category calculation for now
    categories = {
        'readability': max(0, 100 - (len([i for i in issues if i['type'] == 'warning']) * 10)),
        'efficiency': 85,
        'bestPractices': max(0, 100 - (len([i for i in issues if i['type'] == 'info']) * 5)),
    }
    
    return jsonify({
        'score': final_score,
        'issues': issues,
        'categories': categories
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
