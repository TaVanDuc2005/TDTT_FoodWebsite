import google.generativeai as genai
import json
from src.config import settings

class IntentParser:
    def __init__(self):
        genai.configure(api_key=settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel('gemini-2.5-flash-lite')

    def parse(self, query: str) -> list[dict]:
        """
        Input: "tôi muốn ăn phở bò sau đó uống cafe q1"
        Output: [
            {"keyword": "phở bò", "district": "Quận 1"}, 
            {"keyword": "uống cafe", "district": "Quận 1"}
        ]
        """
        prompt = f"""
        Đóng vai trò là một AI phân tích ý định tìm kiếm địa điểm (Intent Parser).
        Nhiệm vụ: Chuyển đổi câu nói tự nhiên thành danh sách các bước hành động (JSON).

        INPUT: "{query}"

        QUY TẮC XỬ LÝ:
        1. Tách câu thành các bước riêng biệt dựa trên thứ tự thời gian.
        2. Trích xuất 'district':
           - Chuẩn hóa tên: "q1", "quận nhất" -> "Quận 1"; "bình thạnh" -> "Bình Thạnh".
           - TƯ DUY NGỮ CẢNH (Context): Nếu một bước không nói rõ quận, hãy LẤY QUẬN CỦA BƯỚC KHÁC trong câu (ưu tiên quận được nhắc ở cuối câu hoặc quận chủ đạo).
           - Nếu cả câu không có địa điểm, trả về null.
        3. Trích xuất 'keyword':
           - Giữ lại tên món/hoạt động + tính từ mô tả (VD: "cafe yên tĩnh", "phở máy lạnh").
           - Loại bỏ từ thừa: "tôi muốn", "kiếm", "tìm", "đi", "ăn", "uống", "ở", "tại", "khu vực".
        4. Định dạng Output: CHỈ trả về JSON Array, không Markdown, không giải thích.

        VÍ DỤ MẪU (Few-shot Learning):
        - Input: "Kiếm quán cơm tấm rồi đi cafe q3"
          Output: [{{"keyword": "cơm tấm", "district": "Quận 3"}}, {{"keyword": "cafe", "district": "Quận 3"}}]
        
        - Input: "Ăn phở bò q1 xong qua bình thạnh uống trà sữa"
          Output: [{{"keyword": "phở bò", "district": "Quận 1"}}, {{"keyword": "trà sữa", "district": "Bình Thạnh"}}]

        - Input: "quán nhậu bình dân"
          Output: [{{"keyword": "quán nhậu bình dân", "district": null}}]

        YOUR OUTPUT:
        """

        try:
            response = self.model.generate_content(prompt)
            # Làm sạch chuỗi JSON phòng khi Gemini thêm ```json
            text = response.text.replace("```json", "").replace("```", "").strip()
            return json.loads(text)
        except Exception as e:
            print(f"❌ NLP Error: {e}")
            # Fallback cơ bản nếu lỗi: Trả về nguyên câu
            return [{"keyword": query, "district": None}]
# if __name__ == "__main__":
#     parser = IntentParser()
#     result = parser.parse("Sáng tôi ăn bánh mì sau đó ăn phở ở q3")
#     print(type(result))