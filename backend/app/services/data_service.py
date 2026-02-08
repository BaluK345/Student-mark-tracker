"""Data processing service for CSV uploads and visualizations."""
import pandas as pd
import io
from typing import Dict, List, Any, Optional
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import base64
from io import BytesIO


class DataService:
    """Service for processing uploaded data and generating visualizations."""
    
    @staticmethod
    def process_csv(file_content: bytes) -> Dict[str, Any]:
        """Process uploaded CSV file and extract student data."""
        try:
            # Read CSV
            df = pd.read_csv(io.BytesIO(file_content))
            
            # Basic validation
            if df.empty:
                raise ValueError("CSV file is empty")
            
            # Get column names
            columns = df.columns.tolist()
            
            # Convert to records
            records = df.to_dict('records')
            
            # Basic statistics
            stats = {
                "total_rows": len(df),
                "columns": columns,
                "numeric_columns": df.select_dtypes(include=['number']).columns.tolist(),
                "missing_values": df.isnull().sum().to_dict()
            }
            
            return {
                "success": True,
                "data": records,
                "stats": stats,
                "preview": records[:10]  # First 10 rows for preview
            }
            
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    @staticmethod
    def generate_grade_distribution_chart(marks_data: List[Dict[str, Any]]) -> str:
        """Generate grade distribution pie chart."""
        try:
            # Extract marks
            marks = [m.get("marks_obtained", 0) for m in marks_data]
            
            # Define grade ranges
            grades = {"A": 0, "B": 0, "C": 0, "D": 0, "F": 0}
            for mark in marks:
                if mark >= 90:
                    grades["A"] += 1
                elif mark >= 75:
                    grades["B"] += 1
                elif mark >= 60:
                    grades["C"] += 1
                elif mark >= 40:
                    grades["D"] += 1
                else:
                    grades["F"] += 1
            
            # Create pie chart
            fig, ax = plt.subplots(figsize=(10, 6))
            colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#991b1b']
            wedges, texts, autotexts = ax.pie(
                grades.values(),
                labels=grades.keys(),
                autopct='%1.1f%%',
                colors=colors,
                startangle=90
            )
            
            # Styling
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontsize(12)
                autotext.set_weight('bold')
            
            ax.set_title('Grade Distribution', fontsize=16, fontweight='bold', pad=20)
            
            # Convert to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            print(f"Error generating chart: {str(e)}")
            return ""
    
    @staticmethod
    def generate_subject_performance_chart(marks_by_subject: Dict[str, List[int]]) -> str:
        """Generate subject-wise performance bar chart."""
        try:
            subjects = list(marks_by_subject.keys())
            avg_marks = [sum(marks) / len(marks) if marks else 0 
                        for marks in marks_by_subject.values()]
            
            # Create bar chart
            fig, ax = plt.subplots(figsize=(12, 6))
            bars = ax.bar(subjects, avg_marks, color='#667eea', alpha=0.8)
            
            # Add value labels on bars
            for bar in bars:
                height = bar.get_height()
                ax.text(bar.get_x() + bar.get_width()/2., height,
                       f'{height:.1f}',
                       ha='center', va='bottom', fontweight='bold')
            
            ax.set_xlabel('Subjects', fontsize=12, fontweight='bold')
            ax.set_ylabel('Average Marks', fontsize=12, fontweight='bold')
            ax.set_title('Subject-wise Performance', fontsize=16, fontweight='bold', pad=20)
            ax.set_ylim(0, 100)
            ax.grid(axis='y', alpha=0.3)
            
            plt.xticks(rotation=45, ha='right')
            
            # Convert to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            print(f"Error generating chart: {str(e)}")
            return ""
    
    @staticmethod
    def generate_pass_fail_chart(marks_data: List[Dict[str, Any]]) -> str:
        """Generate pass/fail distribution chart."""
        try:
            pass_count = sum(1 for m in marks_data if m.get("status") == "Pass")
            fail_count = len(marks_data) - pass_count
            
            # Create pie chart
            fig, ax = plt.subplots(figsize=(8, 6))
            colors = ['#10b981', '#ef4444']
            wedges, texts, autotexts = ax.pie(
                [pass_count, fail_count],
                labels=['Pass', 'Fail'],
                autopct='%1.1f%%',
                colors=colors,
                startangle=90
            )
            
            for autotext in autotexts:
                autotext.set_color('white')
                autotext.set_fontsize(14)
                autotext.set_weight('bold')
            
            ax.set_title('Pass/Fail Distribution', fontsize=16, fontweight='bold', pad=20)
            
            # Convert to base64
            buffer = BytesIO()
            plt.savefig(buffer, format='png', dpi=100, bbox_inches='tight')
            buffer.seek(0)
            image_base64 = base64.b64encode(buffer.getvalue()).decode()
            plt.close()
            
            return f"data:image/png;base64,{image_base64}"
            
        except Exception as e:
            print(f"Error generating chart: {str(e)}")
            return ""
    
    @staticmethod
    def get_analytics_summary(marks_data: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Get comprehensive analytics summary."""
        if not marks_data:
            return {}
        
        marks_values = [m.get("marks_obtained", 0) for m in marks_data]
        
        return {
            "total_students": len(set(m.get("student_id") for m in marks_data)),
            "total_assessments": len(marks_data),
            "average_marks": sum(marks_values) / len(marks_values) if marks_values else 0,
            "highest_marks": max(marks_values) if marks_values else 0,
            "lowest_marks": min(marks_values) if marks_values else 0,
            "pass_count": sum(1 for m in marks_data if m.get("status") == "Pass"),
            "fail_count": sum(1 for m in marks_data if m.get("status") == "Fail"),
            "pass_percentage": (sum(1 for m in marks_data if m.get("status") == "Pass") / len(marks_data) * 100) if marks_data else 0
        }


# Singleton instance
data_service = DataService()
