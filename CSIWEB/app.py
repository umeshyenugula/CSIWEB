from flask import Flask, render_template, request, jsonify, session, redirect
from pymongo import MongoClient
import hashlib
import dotenv
import cloudinary
import cloudinary.uploader
from datetime import datetime
from bson import ObjectId
# Initialize Flask app
app = Flask(__name__)
app.secret_key = "YOUR_SECRET_KEY"

# Load environment variables
dotenv.load_dotenv()

# MongoDB connection
mongo_uri = dotenv.get_key(".env", "mongo_uri")
client = MongoClient(mongo_uri)
db = client["CSI_WEBSITE"]
admins = db["admin_users"]
hero_collection = db["hero_section"]  
events_collection = db["events"]

# Cloudinary configuration
cloudinary.config(
    cloudinary_url=dotenv.get_key(".env", "CLOUDINARY_URL")
)
@app.route("/")
def index():
    return render_template("index.html")

@app.route("/partials/<page>")
def user_partial(page):
    try:
        return render_template(f"partials/{page}.html")
    except:
        return "Page Not Found", 404

@app.route("/pages/<page>")
def serve_spa_page(page):
    return render_template("index.html")

@app.route("/admin/login", methods=["POST"])
def admin_login():
    data = request.json
    username = data.get("username")
    password = data.get("password")
    admin = admins.find_one({"username": username})
    if not admin:
        return jsonify({"status": "error", "message": "Invalid username"}), 401
    if admin["password"] != password:
        return jsonify({"status": "error", "message": "Invalid password"}), 401
    session_key = hashlib.sha256((username + password).encode()).hexdigest()
    session["admin"] = {
        "username": username,
        "session_key": session_key
    }
    return jsonify({
        "status": "success",
        "redirect": "/admin-panel",
        "session_key": session_key
    })

@app.route("/admin-panel")
def admin_panel():
    if "admin" not in session:
        return redirect("/")
    return render_template("admin.html", page="dashboard")

@app.route("/admin/pages/<page>")
def admin_spa(page):
    if "admin" not in session:
        return redirect("/")
    return render_template("admin.html", page=page)

@app.route("/admin/<page>")
def admin_partial(page):
    try:
        return render_template(f"admin/{page}.html")
    except:
        return "Page Not Found", 404

# Route to handle Hero Section updates
from datetime import datetime

@app.route("/admin/update-hero", methods=["POST"])
def update_hero():
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Admin not logged in"}), 401
    try:
        hero_title = request.form.get('heroTitle', '').strip()
        btn1_label = request.form.get('btn1Label', '').strip()
        btn1_link = request.form.get('btn1Link', '').strip()
        btn2_label = request.form.get('btn2Label', '').strip()
        btn2_link = request.form.get('btn2Link', '').strip()
        schedule_link = request.form.get('scheduleLink', '').strip()
        hero_banner = request.files.get('heroBanner')

        # ===== Cloudinary overwrite logic =====
        hero_image_url = None
        if hero_banner and hero_banner.filename:
            upload_result = cloudinary.uploader.upload(
                hero_banner,
                folder="CSI/Hero",
                public_id="hero_banner",   # FIXED NAME
                overwrite=True,
                resource_type="image"
            )
            hero_image_url = upload_result.get("secure_url")

        # ===== Data to overwrite in MongoDB =====
        update_data = {
            "hero_title": hero_title,
            "btn1_label": btn1_label,
            "btn1_link": btn1_link,
            "btn2_label": btn2_label,
            "btn2_link": btn2_link,
            "schedule_link": schedule_link,
            "updated_at": datetime.utcnow()
        }

        # Only update image if new one was uploaded
        if hero_image_url:
            update_data["hero_image_url"] = hero_image_url

        # ===== Force overwrite the same document =====
        result = hero_collection.update_one(
            {"type": "hero"},         # Fixed selector (never changes)
            {"$set": update_data},
            upsert=True               # Create once if missing
        )

        return jsonify({
            "status": "success",
            "message": "Hero section overwritten successfully",
            "hero_image_url": hero_image_url
        })

    except Exception as e:
        print("ERROR:", str(e))
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@app.route('/api/hero-section', methods=['GET'])
def get_hero_section():
    last_client_update = request.args.get("last_update")

    data = hero_collection.find_one({}, {"_id": 0})
    if not data:
        return jsonify({"status": "error", "message": "No hero data found"}), 404

    server_time = data.get("updated_at")


    if last_client_update and server_time:
        try:
            client_time = datetime.fromisoformat(last_client_update)
            if server_time <= client_time:
                return jsonify({
                    "status": "not_modified"
                })
        except:
            pass

    # Only send updated values
    response = {"status": "success"}

    allowed_fields = [
        "hero_title",
        "btn1_label",
        "btn1_link",
        "btn2_label",
        "btn2_link",
        "schedule_link",
        "hero_image_url"
    ]

    for field in allowed_fields:
        if field in data:
            response[field] = data[field]

    response["updated_at"] = server_time.isoformat() if server_time else None

    return jsonify(response)

# -------- Add New Event --------
@app.route("/admin/add-event", methods=["POST"])
def add_event():
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    try:
        title = request.form.get("title")
        date = request.form.get("date")
        description = request.form.get("description")
        participants = int(request.form.get("participants", 0))
        image = request.files.get("image")

        image_url = None
        if image and image.filename:
            upload = cloudinary.uploader.upload(
                image,
                folder="CSI/Events"
            )
            image_url = upload.get("secure_url")

        events_collection.insert_one({
            "title": title,
            "date": date,
            "description": description,
            "participants": participants,
            "image_url": image_url,
            "created_at": datetime.utcnow()
        })

        return jsonify({"status": "success", "message": "Event added successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500


# -------- Get Single Event --------
@app.route("/admin/get-event/<event_id>")
def get_event(event_id):
    if "admin" not in session:
        return jsonify({"status": "error"}), 401

    event = events_collection.find_one({"_id": ObjectId(event_id)}, {"_id": 0})
    if not event:
        return jsonify({"status": "error", "message": "Event not found"}), 404

    return jsonify({"status": "success", "data": event})


# -------- Update Event --------
@app.route("/admin/update-event/<event_id>", methods=["POST"])
def update_event(event_id):
    if "admin" not in session:
        return jsonify({"status": "error", "message": "Unauthorized"}), 401

    try:
        title = request.form.get("title")
        date = request.form.get("date")
        description = request.form.get("description")
        participants = int(request.form.get("participants", 0))
        image = request.files.get("image")

        update_data = {
            "title": title,
            "date": date,
            "description": description,
            "participants": participants,
            "updated_at": datetime.utcnow()
        }

        if image and image.filename:
            upload = cloudinary.uploader.upload(
                image,
                folder="CSI/Events",
                overwrite=True
            )
            update_data["image_url"] = upload.get("secure_url")

        events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$set": update_data}
        )

        return jsonify({"status": "success", "message": "Event updated successfully"})

    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
@app.route("/admin/list-events")
def list_events():
    events = list(events_collection.find({}, {
        "_id": 1,
        "title": 1,
        "date": 1,
        "description": 1,
        "participants": 1,
        "image_url": 1
    }))

    for ev in events:
        ev["_id"] = str(ev["_id"])

    return jsonify({
        "status": "success",
        "events": events
    })


@app.route("/api/events")
def get_events():
    events = list(events_collection.find({}, {
        "_id": 0,
        "title": 1,
        "date": 1,
        "description": 1,     
        "participants": 1,      
        "image_url": 1
    }).sort("created_at", -1))

    return jsonify({
        "status": "success",
        "events": events
    })


if __name__ == "__main__":
    app.run(debug=True)
