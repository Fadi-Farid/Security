
from flask import Flask, render_template
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)

# Example secret key & SQLite DB (can be replaced later)
app.config["SECRET_KEY"] = "change-this"
app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///site.db"

db = SQLAlchemy(app)

# Example DB model
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), unique=True, nullable=False)

    def __repr__(self):
        return f"<User {self.username}>"


@app.route("/")
def home():
    return render_template("index.html", title="Home Page")


@app.route("/users")
def users():
    all_users = User.query.all()
    return {
        "users": [user.username for user in all_users]
    }


if __name__ == "__main__":
    app.run(debug=True)
