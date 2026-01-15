// 지도 생성
var container = document.getElementById('map');
var options = {
    center: new kakao.maps.LatLng(37.5665, 126.9780), // 서울 중심
    level: 5
};
var map = new kakao.maps.Map(container, options);

// 샘플 로또 매장 데이터
var stores = [
    { name: "우리집", lat: 37.447033, lng: 126.665007 },
    { name: "수은수아집", lat: 37.459218, lng: 126.642461 },
    { name: "할머니집", lat: 37.483231, lng: 126.626268 }
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
