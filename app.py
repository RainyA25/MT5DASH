from flask import Flask, render_template, send_from_directory, jsonify
import requests

app = Flask(__name__)

# Serve homepage
@app.route("/")
def home():
    return render_template("index.html")

# Proxy for trades
@app.route("/api/trades")
def proxy_trades():
    url = "https://app.fundingtraders.com/metrix/download_trades_data?id_account=6834706"
    response = requests.get(url)
    return (response.text, response.status_code, {'Content-Type': 'application/json'})

# Proxy for chart
@app.route("/api/chart")
def proxy_chart():
    url = "https://app.fundingtraders.com/metrix/chart?id_account=6834706&limit=1000"
    response = requests.get(url)
    return (response.text, response.status_code, {'Content-Type': 'application/json'})
