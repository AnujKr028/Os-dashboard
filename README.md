**📊 Real-Time Process Monitoring Dashboard**

***Overview:***
A lightweight dashboard that shows live CPU, memory usage, and top processes. Helps system admins monitor system health and take action quickly.

***Key Features:***

Live CPU & RAM usage charts

Top processes by usage

Color-coded alerts for high usage

Simple, responsive UI

***Modules:***

Backend (Python + psutil): Gathers system data, serves JSON via Flask.

Frontend (HTML/JS): Visualizes data using fetch() and live updates.

Communication Layer: Connects backend & frontend using APIs.

***Extras:***

Option to kill processes

Filter/sort process list

***Tech Stack:***
Python, psutil, Flask, HTML, CSS, JavaScript, Fetch API

***Execution Steps:***

Build backend endpoints

Design frontend layout

Connect via fetch + setInterval

Add styling & alerts

Test & optimize

***Sample JSON:***

json
Copy
Edit
{
  "cpu_usage": 72.5,
  "memory_usage": 65.1,
  "top_processes": [
    {"pid": 1234, "name": "chrome.exe", "cpu": 35.2, "memory": 210},
    {"pid": 5678, "name": "python.exe", "cpu": 18.9, "memory": 155}
  ]
}

***Screenshots:***

![Screenshot 2025-04-21 110516](https://github.com/user-attachments/assets/bb6ec056-f268-4136-a671-b084cf42ab85)

***Tips:***

Poll every 2–3 sec

Limit JSON size

Keep UI light

***Conclusion:***
A great full-stack project to visualize system performance in real-time and strengthen OS + web dev skills.








