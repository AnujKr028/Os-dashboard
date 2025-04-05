from flask import Flask, jsonify, request
from flask_cors import CORS
import psutil
import time
import os
import platform
import signal

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={
    r"/api/*": {
        "origins": ["http://localhost:*", "http://127.0.0.1:*"],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type"]
    }
})

# Warm up CPU monitoring
_ = psutil.cpu_percent()

@app.route('/api/processes')
def get_processes():
    try:
        sort_by = request.args.get('sort', default='cpu', type=str)
        
        processes = []
        for proc in psutil.process_iter(['pid', 'name', 'cpu_percent', 'memory_info', 'username', 'status']):
            try:
                info = proc.info
                processes.append({
                    'pid': info['pid'],
                    'name': info['name'],
                    'cpu': info['cpu_percent'],
                    'ram': round(info['memory_info'].rss / (1024 * 1024)),  # in MB
                    'user': info['username'],
                    'status': info['status']
                })
            except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
                continue
        
        # Sort processes
        if sort_by == 'cpu':
            processes.sort(key=lambda x: x['cpu'], reverse=True)
        elif sort_by == 'ram':
            processes.sort(key=lambda x: x['ram'], reverse=True)
        elif sort_by == 'name':
            processes.sort(key=lambda x: x['name'].lower())
        elif sort_by == 'pid':
            processes.sort(key=lambda x: x['pid'])
        
        return jsonify(processes)
    
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to retrieve processes'
        }), 500

@app.route('/api/usage')
def get_usage():
    try:
        cpu = psutil.cpu_percent(interval=1)
        ram = psutil.virtual_memory()
        disk = psutil.disk_usage('/')
        
        return jsonify({
            'cpu': {
                'percent': cpu,
                'cores': psutil.cpu_count(logical=True)
            },
            'ram': {
                'percent': ram.percent,
                'used': round(ram.used / (1024 ** 3)),  # GB
                'total': round(ram.total / (1024 ** 3))  # GB
            },
            'disk': {
                'percent': disk.percent,
                'used': round(disk.used / (1024 ** 3)),  # GB
                'total': round(disk.total / (1024 ** 3))  # GB
            }
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to retrieve system usage'
        }), 500


ALLOWED_TERMINATE = ["chrome.exe", "notepad.exe", "python.exe", "msedge.exe"]

@app.route('/api/terminate/<int:pid>', methods=['POST'])
def terminate_process(pid):
    try:
        process = psutil.Process(pid)
        if process.name().lower() not in ALLOWED_TERMINATE:
            return jsonify({
                'success': False,
                'message': f'Cannot terminate {process.name()} (not whitelisted)'
            }), 403
        
        process.terminate()
        time.sleep(0.5)
        
        if process.is_running():
            process.kill()
            
        return jsonify({'success': True, 'message': f'Process {pid} terminated'})
    except psutil.NoSuchProcess:
        return jsonify({'success': True, 'message': f'Process {pid} not found'})
    except psutil.AccessDenied:
        return jsonify({'success': False, 'message': 'Access denied. Try running as administrator.'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/system_info')
def system_info():
    try:
        boot_time = psutil.boot_time()
        cpu_model = "Unknown"
        
        try:
            if os.name == 'nt':  # Windows
                cpu_model = os.popen('wmic cpu get name').read().strip().split('\n')[1]
            elif os.name == 'posix':  # Linux/Mac
                with open('/proc/cpuinfo') as f:
                    for line in f:
                        if line.strip() and line.split(':')[0].strip() == 'model name':
                            cpu_model = line.split(':')[1].strip()
                            break
        except Exception as e:
            print(f"Error getting CPU model: {str(e)}")
        
        return jsonify({
            'system': {
                'platform': platform.system(),
                'platform_version': platform.version(),
                'uptime': round((time.time() - boot_time) / 3600, 2),  # hours
                'boot_time': time.strftime("%Y-%m-%d %H:%M:%S", time.localtime(boot_time))
            },
            'cpu': {
                'model': cpu_model,
                'cores_physical': psutil.cpu_count(logical=False),
                'cores_logical': psutil.cpu_count(logical=True)
            }
        })
    except Exception as e:
        return jsonify({
            'error': str(e),
            'message': 'Failed to retrieve system information'
        }), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0')