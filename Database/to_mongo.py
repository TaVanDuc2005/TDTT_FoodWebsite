import pandas as pd
from pymongo import MongoClient
import certifi
import numpy as np

URL = "mongodb+srv://lnqhoc2407_db_user:admin123456@cluster0.zh3u1zk.mongodb.net/?appName=Cluster0"
DB_NAME = "tdtt"
COLLECTION_NAME = "restaurants"

PATH_RESTAURANTS = "tat_ca_thong_tin_nha_hang.csv" # Hoặc tên file chứa thông tin quán
PATH_REVIEWS = "tat_ca_binh_luan_nha_hang.csv"      # Hoặc tên file chứa review

def clean_value(val, default_val=None):
    """Hàm phụ trợ để xử lý dữ liệu NaN (Not a Number) thành None hoặc giá trị mặc định"""
    if pd.isna(val) or val == "" or val == "nan":
        return default_val
    return val

def migrate_data():
    print("⏳ [1/4] Đang đọc dữ liệu từ CSV...")
    try:
        df_res = pd.read_csv(PATH_RESTAURANTS)
        df_res.columns = [
            "ten_quan",
            "diem_trung_binh",
            "dia_chi",
            "gio_mo_cua",
            "gia_ca",
            "lat",
            "lon",
            "diem_khong_gian",
            "diem_vi_tri",
            "diem_chat_luong",
            "diem_phuc_vu",
            "diem_gia_ca",
            "avatar_url",
            "url_goc"
        ]
        df_rev = pd.read_csv(PATH_REVIEWS)
    except FileNotFoundError:
        print("❌ Lỗi: Không tìm thấy file CSV. Hãy kiểm tra lại đường dẫn!")
        return

    # ==========================================
    # XỬ LÝ 1: GOM NHÓM REVIEW (LIST OF OBJECTS)
    # ==========================================
    print("⚙️ [2/4] Đang xử lý và gom nhóm Review...")
    
    def pack_reviews(group):
        reviews = []
        for _, row in group.iterrows():
            reviews.append({
                "rating": clean_value(row.get('diem_review'), 0.0),
                "content": clean_value(row.get('noi_dung'), "")
            })
        return reviews

    # Group review theo 'url_goc'
    review_map = df_rev.groupby('url_goc').apply(pack_reviews).to_dict()

    # ==========================================
    # XỬ LÝ 2: BIẾN ĐỔI SANG SCHEMA CUỐI CÙNG
    # ==========================================
    print("⚙️ [3/4] Đang tạo cấu trúc JSON (Nested)...")
    
    documents = []

    for _, row in df_res.iterrows():
        url = row.get('url_goc')
        
        # 1. Lấy danh sách review tương ứng (nếu không có thì trả về rỗng)
        reviews_list = review_map.get(url, [])

        # 2. Xử lý tọa độ (GeoJSON format: [Longitude, Latitude])
        # Lưu ý: Mongo yêu cầu [Kinh độ, Vĩ độ] - Ngược với Google Maps
        try:
            lat = float(row['lat'])
            lon = float(row['lon'])
            geo_location = {
                "type": "Point",
                "coordinates": [lon, lat] 
            }
        except (ValueError, KeyError):
            geo_location = None

        # 3. Tạo Object Scores lồng nhau
        scores_obj = {
            "space": clean_value(row.get('diem_khong_gian'), 0.0),
            "position": clean_value(row.get('diem_vi_tri'), 0.0),
            "quality": clean_value(row.get('diem_chat_luong'), 0.0),
            "service": clean_value(row.get('diem_phuc_vu'), 0.0),
            "price": clean_value(row.get('diem_gia_ca'), 0.0)
        }

        # 4. Gom tất cả vào Schema chính
        doc = {
            "name": clean_value(row.get('ten_quan'), "Không tên"),
            "avg_rating": clean_value(row.get('diem_trung_binh'), 0.0),
            "address": clean_value(row.get('dia_chi'), ""),
            "opening_hours": clean_value(row.get('gio_mo_cua'), ""),
            "price_range": clean_value(row.get('gia_ca'), ""),
            
            "location": geo_location, # Object GeoJSON
            
            "scores": scores_obj,     # Object Scores
            
            "avatar_url": clean_value(row.get('avatar_url'), ""),
            "source_url": url,
            
            "reviews": reviews_list   # List of Objects Review
        }
        
        documents.append(doc)

    # ==========================================
    # DATABASE: ĐẨY LÊN MONGODB
    # ==========================================
    print(f"🚀 [4/4] Đang kết nối và đẩy {len(documents)} nhà hàng lên MongoDB Atlas...")
    
    try:
        client = MongoClient(URL, tlsCAFile=certifi.where())
        db = client[DB_NAME]
        collection = db[COLLECTION_NAME]

        # Xóa dữ liệu cũ để tránh trùng lặp khi chạy lại
        collection.delete_many({})
        print("   -> Đã dọn sạch dữ liệu cũ.")

        # Insert lô lớn (Batch insert)
        if documents:
            collection.insert_many(documents)
            print(f"✅ THÀNH CÔNG! Đã lưu {len(documents)} nhà hàng vào Database '{DB_NAME}'.")
        else:
            print("⚠️ Cảnh báo: Không có dữ liệu nào được tạo ra.")

    except Exception as e:
        print(f"❌ LỖI KẾT NỐI MONGODB: {e}")

if __name__ == "__main__":
    migrate_data()