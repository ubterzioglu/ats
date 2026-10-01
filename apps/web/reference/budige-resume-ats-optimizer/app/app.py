"""
Resume Parser Flask Application
Simple web interface for resume parsing and ATS scoring

TODO: Add user authentication
TODO: Improve UI/UX
FIXME: Handle large PDF files better (current limit 5MB)
"""
from flask import Flask, render_template, request, jsonify
import sys
sys.path.append('..')
from src.parser import ResumeParser

app = Flask(__name__)
parser = ResumeParser()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/parse', methods=['POST'])
def parse_resume():
    # TODO: Add file validation
    file = request.files['resume']
    result = parser.parse(file)
    return jsonify(result)

if __name__ == '__main__':
    # NOTE: Debug mode for development only
    app.run(debug=True, port=5000)
