# YOLO-Agent 工业缺陷智能分析系统

![YOLO-Agent Logo](https://img.shields.io/badge/YOLO-Agent-v1.0-blue)
![Python Version](https://img.shields.io/badge/Python-3.8%2B-green)
![Flask Version](https://img.shields.io/badge/Flask-2.0%2B-yellow)

YOLO-Agent是一款基于深度学习的工业缺陷智能分析系统，集成了**目标检测**、**知识图谱**、**智能问答**三大核心能力。系统能够自动识别工业产品图像中的缺陷，提供专业的原因分析、解决方案和预防措施。

## 🎯 功能特性

### 1. 目标检测
- 基于YOLOv8深度学习框架
- 支持检测10种工业缺陷类型：
  - 划痕、裂纹、凹陷、凸起、腐蚀
  - 磨损、变形、污渍、气泡、断裂
- 自动标注缺陷位置、置信度和面积
- 可视化检测结果，支持边界框绘制

### 2. 知识图谱
- 包含完整的缺陷知识库
- 提供缺陷描述、可能原因、解决方案和预防措施
- 支持关键词搜索功能
- 数据来源可靠，涵盖工业领域专业文献

### 3. 智能问答
- 支持自然语言交互
- 可回答以下类型问题：
  - **统计类**：图片中有多少个缺陷？
  - **原因分析**：划痕是什么原因造成的？
  - **解决方案**：如何解决裂纹问题？
  - **预防措施**：如何预防腐蚀的发生？
  - **综合分析**：帮我分析一下检测结果

## 🛠️ 技术栈

- **后端框架**: Flask 2.0+
- **目标检测**: YOLOv8 (ultralytics)
- **图像处理**: OpenCV
- **前端**: HTML5 + CSS3 + JavaScript
- **图标**: Material Icons

## 📦 安装步骤

### 1. 克隆项目
```bash
git clone <repository-url>
cd yolo-agent
```

### 2. 安装依赖
```bash
pip install -r requirements.txt
```

### 3. 运行应用
```bash
# 方式一：直接运行启动脚本
python start.py

# 方式二：进入backend目录运行
cd backend
python app.py
```

### 4. 访问系统
打开浏览器访问 http://localhost:5000

## 📁 项目结构

```
yolo-agent/
├── backend/                  # 后端代码
│   ├── app.py               # Flask应用入口
│   ├── yolo_detector.py     # YOLO目标检测模块
│   ├── knowledge_base.py    # 知识图谱模块
│   └── report_generator.py  # 报告生成模块
├── frontend/                # 前端代码
│   ├── index.html           # 主页面
│   ├── css/
│   │   └── style.css        # 样式文件
│   └── js/
│       └── app.js           # 前端脚本
├── uploads/                 # 上传文件目录
├── static/                  # 静态资源目录
├── reports/                 # 报告输出目录
├── models/                  # YOLO模型文件目录
├── requirements.txt         # 依赖列表
├── start.py                 # 启动脚本
└── README.md                # 项目说明
```

## 🚀 使用方法

### 1. 缺陷检测
1. 点击导航栏的「缺陷检测」
2. 点击或拖拽上传工业产品图像（支持PNG、JPG、JPEG、BMP格式）
3. 等待系统自动检测并显示结果
4. 查看检测到的缺陷列表和分析报告

### 2. 知识图谱
1. 点击导航栏的「知识图谱」
2. 浏览缺陷类型列表或搜索相关知识
3. 点击缺陷卡片查看详细信息（描述、原因、解决方案、预防措施）

### 3. 智能问答
1. 点击导航栏的「智能问答」
2. 在输入框中输入问题
3. 系统会根据检测结果和知识库提供专业回答

## 📝 API接口

| 接口 | 方法 | 描述 |
|------|------|------|
| `/api/upload` | POST | 上传图片并进行检测 |
| `/api/generate_report` | POST | 生成分析报告 |
| `/api/defect_info/<type>` | GET | 获取缺陷详细信息 |
| `/api/search_knowledge` | POST | 搜索知识库 |
| `/api/ask` | POST | 智能问答 |
| `/api/model_status` | GET | 获取模型状态 |

## 🔧 配置说明

### 模型路径
- 默认模型路径：`models/yolov8n.pt`
- 首次启动时会自动下载模型（需联网）
- 支持使用自定义训练的YOLO模型

### 置信度阈值
- 默认置信度阈值：0.5
- 可在 `yolo_detector.py` 中调整

## 📄 许可证

MIT License

## 🤝 贡献

欢迎提交Issue和Pull Request！

## 📧 联系方式

如有问题或建议，请通过以下方式联系：
- 邮箱：support@yolo-agent.com
- GitHub：https://github.com/your-repo