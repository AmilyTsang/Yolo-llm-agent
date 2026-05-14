#!/usr/bin/env python
import os
import subprocess
import sys

def main():
    # 确保所有目录存在
    dirs = ['models', 'uploads', 'static', 'reports', 'frontend/css', 'frontend/js']
    for d in dirs:
        os.makedirs(d, exist_ok=True)
    
    print("🚀 启动 YOLO-Agent 工业缺陷智能分析系统...")
    print("📡 服务地址: http://localhost:5000")
    print("🔄 按 Ctrl+C 停止服务")
    print()
    
    # 切换到backend目录启动 Flask 应用
    backend_dir = os.path.join(os.path.dirname(__file__), 'backend')
    print(f"📂 切换到目录: {backend_dir}")
    
    # 检查是否安装了依赖
    try:
        from flask import Flask
        from flask_cors import CORS
        print("✅ Flask 依赖检查通过")
    except ImportError as e:
        print(f"⚠️  Flask 依赖未安装: {e}")
        print("建议运行: pip install flask flask-cors")
    
    try:
        from ultralytics import YOLO
        print("✅ YOLO 依赖检查通过")
    except ImportError as e:
        print(f"⚠️  YOLO 依赖未安装: {e}")
        print("建议运行: pip install ultralytics")
    
    # 启动 Flask 应用
    print("🔧 启动 Flask 服务...")
    os.chdir(backend_dir)
    
    # 使用绝对路径调用Python
    python_path = sys.executable
    print(f"🐍 Python 路径: {python_path}")
    
    # 直接运行app.py
    subprocess.call([python_path, 'app.py'], shell=True)

if __name__ == '__main__':
    try:
        main()
    except Exception as e:
        print(f"❌ 启动失败: {e}")
        import traceback
        traceback.print_exc()
        input("按 Enter 键退出...")
