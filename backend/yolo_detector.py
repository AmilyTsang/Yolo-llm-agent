import os
import cv2
import numpy as np
import traceback

class YOLODetector:
    def __init__(self):
        self.model = None
        self.model_loaded = False
        self.model_error = None
        self.classes = [
            '划痕', '裂纹', '凹陷', '凸起', '腐蚀', 
            '磨损', '变形', '污渍', '气泡', '断裂'
        ]
        self.colors = [
            (0, 0, 255),    # 红色 - 划痕
            (0, 255, 255),  # 黄色 - 裂纹
            (255, 0, 0),    # 蓝色 - 凹陷
            (0, 255, 0),    # 绿色 - 凸起
            (255, 255, 0),  # 青色 - 腐蚀
            (255, 0, 255),  # 品红 - 磨损
            (128, 0, 255),  # 紫色 - 变形
            (255, 128, 0),  # 橙色 - 污渍
            (0, 128, 255),  # 粉红 - 气泡
            (128, 128, 0)   # 橄榄 - 断裂
        ]
        
        # 尝试加载YOLO模型
        self._load_model()
    
    def _load_model(self):
        """加载YOLO模型，处理各种异常情况"""
        model_path = '../models/yolov8n.pt'
        model_dir = '../models'
        
        try:
            # 确保模型目录存在
            os.makedirs(model_dir, exist_ok=True)
            
            # 尝试导入ultralytics库
            from ultralytics import YOLO
            
            if os.path.exists(model_path):
                # 加载本地模型
                self.model = YOLO(model_path)
                self.model_loaded = True
                self.model_error = None
                print("✅ YOLO模型加载成功")
            else:
                # 尝试从官方下载模型
                print("ℹ️  本地模型文件不存在，尝试从官方下载...")
                try:
                    self.model = YOLO('yolov8n.pt')
                    # 保存到本地
                    self.model.save(model_path)
                    self.model_loaded = True
                    self.model_error = None
                    print("✅ YOLO模型下载并加载成功")
                except Exception as e:
                    self.model_error = f"模型下载失败: {str(e)}"
                    print(f"❌ {self.model_error}，将使用模拟检测")
                    
        except ImportError:
            self.model_error = "未安装ultralytics库"
            print(f"❌ {self.model_error}，请运行: pip install ultralytics")
            
        except Exception as e:
            self.model_error = f"模型加载失败: {str(e)}"
            print(f"❌ {self.model_error}，将使用模拟检测")
            traceback.print_exc()
    
    def detect(self, image_path):
        """
        检测图像中的缺陷
        返回格式: [{
            'type': '划痕',
            'confidence': 0.85,
            'bbox': [x1, y1, x2, y2],
            'area': 1200
        }]
        """
        if self.model is not None and self.model_loaded:
            try:
                return self._detect_real(image_path)
            except Exception as e:
                print(f"❌ YOLO推理失败: {str(e)}")
                traceback.print_exc()
                # 推理失败时返回空列表，不返回模拟框
                return []
        else:
            return self._detect_simulated(image_path)
    
    def _detect_real(self, image_path):
        """使用真实YOLO模型检测"""
        # 先验证图像是否可读
        img = cv2.imread(image_path)
        if img is None:
            print(f"❌ 无法读取图像: {image_path}")
            return []
        
        height, width = img.shape[:2]
        detections = []
        
        try:
            results = self.model(image_path)
            
            for result in results:
                if result.boxes is not None:
                    boxes = result.boxes
                    for box in boxes:
                        # 安全地获取类别和置信度
                        cls = int(box.cls[0].detach().cpu().numpy()) if hasattr(box.cls, 'detach') else int(box.cls[0])
                        conf = float(box.conf[0].detach().cpu().numpy()) if hasattr(box.conf, 'detach') else float(box.conf[0])
                        
                        if conf > 0.5:  # 置信度阈值
                            # 安全地获取边界框坐标
                            xyxy = box.xyxy[0].detach().cpu().numpy() if hasattr(box.xyxy, 'detach') else box.xyxy[0].numpy()
                            x1, y1, x2, y2 = map(int, xyxy)
                            
                            # 边界裁剪，确保坐标在图像范围内
                            x1 = max(0, min(x1, width - 1))
                            y1 = max(0, min(y1, height - 1))
                            x2 = max(0, min(x2, width - 1))
                            y2 = max(0, min(y2, height - 1))
                            
                            # 确保x2 > x1, y2 > y1
                            if x2 <= x1 or y2 <= y1:
                                continue
                            
                            defect_type = self.classes[cls] if cls < len(self.classes) else '未知'
                            
                            detections.append({
                                'type': defect_type,
                                'confidence': conf,
                                'bbox': [x1, y1, x2, y2],
                                'area': (x2 - x1) * (y2 - y1)
                            })
            
            print(f"✅ 检测完成，发现 {len(detections)} 个缺陷")
            return detections
            
        except Exception as e:
            print(f"❌ YOLO检测异常: {str(e)}")
            traceback.print_exc()
            return []
    
    def _detect_simulated(self, image_path):
        """模拟检测结果（当YOLO不可用时）"""
        # 读取图像获取尺寸
        img = cv2.imread(image_path)
        if img is None:
            print(f"❌ 无法读取图像: {image_path}")
            return []
        
        height, width = img.shape[:2]
        
        # 生成随机模拟缺陷
        import random
        random.seed(42)  # 固定种子以获得可预测的结果
        
        num_defects = random.randint(1, 3)
        detections = []
        
        defect_types = ['划痕', '裂纹', '凹陷', '腐蚀', '磨损']
        
        for _ in range(num_defects):
            defect_type = random.choice(defect_types)
            x1 = random.randint(50, min(width - 150, width - 1))
            y1 = random.randint(50, min(height - 150, height - 1))
            x2 = min(x1 + random.randint(50, 150), width - 1)
            y2 = min(y1 + random.randint(30, 80), height - 1)
            
            # 确保有效框
            if x2 > x1 and y2 > y1:
                detections.append({
                    'type': defect_type,
                    'confidence': round(random.uniform(0.6, 0.95), 2),
                    'bbox': [x1, y1, x2, y2],
                    'area': (x2 - x1) * (y2 - y1)
                })
        
        print(f"⚠️ 使用模拟检测，生成 {len(detections)} 个模拟缺陷")
        return detections
    
    def draw_boxes(self, image_path, detections, output_path):
        """在图像上绘制检测框"""
        img = cv2.imread(image_path)
        if img is None:
            print(f"❌ 无法读取图像: {image_path}")
            return
        
        height, width = img.shape[:2]
        
        for defect in detections:
            x1, y1, x2, y2 = defect['bbox']
            defect_type = defect['type']
            confidence = defect['confidence']
            
            # 边界检查
            x1 = max(0, min(x1, width - 1))
            y1 = max(0, min(y1, height - 1))
            x2 = max(0, min(x2, width - 1))
            y2 = max(0, min(y2, height - 1))
            
            # 获取颜色
            idx = self.classes.index(defect_type) if defect_type in self.classes else 9
            color = self.colors[idx]
            
            # 绘制矩形框
            cv2.rectangle(img, (x1, y1), (x2, y2), color, 2)
            
            # 添加标签
            label = f"{defect_type} {confidence:.2f}"
            label_size, _ = cv2.getTextSize(label, cv2.FONT_HERSHEY_SIMPLEX, 0.5, 2)
            label_y = max(y1, label_size[1] + 10)
            cv2.rectangle(img, (x1, label_y - label_size[1] - 10), 
                         (x1 + label_size[0], label_y), color, -1)
            cv2.putText(img, label, (x1, label_y - 5), 
                       cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 0), 2)
        
        # 确保输出目录存在
        output_dir = os.path.dirname(output_path)
        if output_dir:
            os.makedirs(output_dir, exist_ok=True)
        
        cv2.imwrite(output_path, img)
        print(f"✅ 检测结果图像已保存: {output_path}")
    
    def get_model_status(self):
        """获取模型加载状态"""
        return {
            'loaded': self.model_loaded,
            'error': self.model_error,
            'has_model': self.model is not None
        }