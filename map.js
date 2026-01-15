var container = document.getElementById('map');
var options = {
  center: new kakao.maps.LatLng(37.447033, 126.665007),
  level: 9
};
var map = new kakao.maps.Map(container, options);

fetch('lotto.csv')
  .then(res => res.text())
  .then(text => {
    const lines = text.split('\n');
    const headers = lines[0].split(',');
    const nameIdx = headers.findIndex(h => h.includes('상호'));
    const regionIdx = headers.findIndex(h => h.includes('지역'));

    const ps = new kakao.maps.services.Places();

    lines.slice(1).forEach(line => {
      const cols = line.split(',');

      if (!cols[regionIdx]?.includes('인천')) return;

      const keyword = cols[regionIdx] + " " + cols[nameIdx];

      ps.keywordSearch(keyword, function(data, status) {
        if (status === kakao.maps.services.Status.OK) {
          const lat = data[0].y;
          const lng = data[0].x;
          const name = data[0].place_name;

          const marker = new kakao.maps.Marker({
            map: map,
            position: new kakao.maps.LatLng(lat, lng),
            title: name
          });

          const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:5px;">${name}</div>`
          });

          kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
          });
        }
      });
    });
  });
