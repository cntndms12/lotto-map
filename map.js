// 지도 생성
var container = document.getElementById('map');
var options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
    level: 5
};
var map = new kakao.maps.Map(container, options);

// 샘플 로또 매장 데이터
var stores = [
    { name: "로또24", lat: 37.5665, lng: 126.9780 },
    { name: "행운복권", lat: 37.5700, lng: 126.9820 },
    { name: "복권천국", lat: 37.5630, lng: 126.9750 }
];

// 매장 마커 찍기
stores.forEach(function(store) {
    var marker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng(store.lat, store.lng),
        title: store.name
    });

    // 클릭하면 이름 보여주기
    var infowindow = new kakao.maps.InfoWindow({
        content: `<div style="padding:5px;">${store.name}</div>`
    });

    kakao.maps.event.addListener(marker, 'click', function() {
        infowindow.open(map, marker);
    });
});
