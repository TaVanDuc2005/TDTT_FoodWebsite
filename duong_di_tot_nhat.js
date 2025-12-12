const handleDirectionClick = async () => {
    // Kiểm tra xem quán ăn có tọa độ hợp lệ không
    if (!hasValidCoords) {
        alert("Không thể chỉ đường vì dữ liệu thiếu tọa độ GPS của quán.");
        return;
    }

    let startLat = null;
    let startLon = null;

    // 1. Kiểm tra xem có tọa độ bắt đầu được lưu trước đó không (ví dụ từ trang Search)
    if (storedRouteStart && storedRouteStart.lat && storedRouteStart.lon) {
        startLat = storedRouteStart.lat;
        startLon = storedRouteStart.lon;
        console.log("✅ Dùng toạ độ từ routeStart (search.js):", startLat, startLon);
    } else {
        // 2. Nếu không, sử dụng Geolocation API của trình duyệt để lấy vị trí hiện tại
        console.log("📡 Không có lat/lon trong routeStart, dùng GPS thiết bị...");

        if (!navigator.geolocation) {
            alert("Trình duyệt của bạn không hỗ trợ lấy vị trí.");
            return;
        }

        // Hiển thị popup thông báo đang tìm vị trí
        if (infoPanel) infoPanel.classList.remove('open');
        const tempPopup = L.popup()
            .setLatLng([restaurant.lat, restaurant.lon])
            .setContent('<span data-key="Finding your location">⏳ Finding your location...</span>')
            .openOn(map);

        try {
            // Promise để lấy vị trí GPS hiện tại
            const position = await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject);
            });

            map.closePopup(tempPopup);

            startLat = position.coords.latitude;
            startLon = position.coords.longitude;
            console.log("✅ GPS position:", startLat, startLon);
        } catch (error) {
            map.closePopup(tempPopup);
            console.error("❌ Geolocation error:", error);
            alert("❌ Không thể lấy vị trí. Vui lòng bật GPS.");
            return;
        }
    }

    // Xóa đường đi cũ nếu đã tồn tại
    if (currentRouteControl) {
        map.removeControl(currentRouteControl);
        currentRouteControl = null;
    }

    // Đánh dấu vị trí người dùng
    L.marker([startLat, startLon], { icon: userIcon })
        .addTo(map)
        .bindPopup('<span data-key="Your starting location">Your starting location</span>')
        .openPopup(); 

    // === PHẦN QUAN TRỌNG NHẤT: KHỞI TẠO ROUTING MACHINE ===
    // Đoạn code này gửi request lên server OSRM để lấy đường đi và khoảng cách
    currentRouteControl = L.Routing.control({
        waypoints: [
            L.latLng(startLat, startLon),              // Điểm bắt đầu
            L.latLng(restaurant.lat, restaurant.lon)   // Điểm đến (Nhà hàng)
        ],
        createMarker: () => null, // Không tạo thêm marker mặc định của thư viện (dùng marker tùy chỉnh ở trên)
        show: true,               // Hiển thị bảng chỉ dẫn (turn-by-turn)
        fitSelectedRoutes: true,  // Tự động zoom map để thấy toàn bộ đường đi
        routeWhileDragging: false,// Không tính lại đường khi kéo thả (để tối ưu hiệu năng)
        addWaypoints: false,      // Không cho phép người dùng thêm điểm dừng
        lineOptions: { 
            styles: [{ color: '#0033ff', opacity: 0.8, weight: 6 }] // Style đường vẽ màu xanh
        }
    }).addTo(map);

    if (infoPanel) infoPanel.classList.remove('open');
};