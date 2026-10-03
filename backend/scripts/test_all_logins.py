import urllib.request, json

test_users = [
    ("admin@loomora.com", "Admin@123"),
    ("production@loomora.com", "Prod@123"),
    ("weaver@loomora.com", "Weaver@123"),
    ("inventory@loomora.com", "Stock@123"),
    ("quality@loomora.com", "Quality@123"),
    ("hr@loomora.com", "Admin@123"),
    ("production@loomora.com", "Admin@123"),
    ("weaver@loomora.com", "Admin@123")
]

all_pass = True
for email, pwd in test_users:
    try:
        data = json.dumps({"email": email, "password": pwd}).encode()
        req = urllib.request.Request("http://127.0.0.1:8000/api/auth/login", data=data, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req) as resp:
            res = json.loads(resp.read().decode())
            print(f"PASS: {email:<26} / {pwd:<12} -> Role: {res['user']['role']}")
    except Exception as e:
        print(f"FAIL: {email} / {pwd} -> {e}")
        all_pass = False

print("\nALL DEMO LOGINS TEST RESULT:", "100% SUCCESS!" if all_pass else "SOME FAILED")
