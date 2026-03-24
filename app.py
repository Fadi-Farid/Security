
from flask import Flask, render_template, request
# NOTE: This app doesn't need to use these libs at runtime for SCA to flag them,
# but we import to make them explicit in the environment.
import yaml  # PyYAML
import jinja2  # Jinja2 (templating engine used by Flask)
import urllib3  # urllib3 (HTTP client)
from werkzeug.middleware.proxy_fix import ProxyFix  # Werkzeug

app = Flask(__name__)
app.wsgi_app = ProxyFix(app.wsgi_app, x_for=1, x_host=1)

@app.route("/")
def home():
    return render_template("index.html", title="Python SCA Demo")

# Optional: a safe YAML echo endpoint to avoid unsafe loaders
@app.route("/yaml", methods=["POST"])
def yaml_echo():
    """
    Demonstrates safe YAML parsing. Even with vulnerable PyYAML pinned for SCA,
    we use safe_load here to avoid a code vulnerability in this demo endpoint.
    """
    text = request.form.get("yaml", "")
    try:
        data = yaml.safe_load(text)  # safe API regardless of library version
    except Exception as e:
        return {"ok": False, "error": str(e)}, 400
    return {"ok": True, "data": data or {}}

@app.route("/healthz")
def healthz():
    return {"status": "ok"}
    
if __name__ == "__main__":
    # Debug server for local testing
    app.run(host="0.0.0.0", port=5000, debug=True)
``
