var container = document.getElementById('map');
var options = {
  center: new kakao.maps.LatLng(37.447033, 126.665007),
  level: 9
};
var map = new kakao.maps.Map(container, options);

fetch('lotto.csv')
  .then(res => res.text())
  .then(text => {
    const lines = text.trim().split('\n').map(l => l.replace('\r',''));
    const headers = lines[0].split(',').map(h => h.replace(/"/g,''));

    const regionIdx = headers.findIndex(h => h.includes('지역'));
    const nameIdx   = headers.findIndex(h => h.includes('상호'));
    const winIdx    = headers.findIndex(h => h.includes('1등'));

    console.log("headers:", headers);
    console.log("index:", { regionIdx, nameIdx, winIdx });

    const ps = new kakao.maps.services.Places();
    const rows = lines.slice(1);

    function processRow(i) {
      if (i >= rows.length) return;

      const cols = rows[i].split(',').map(c => c.replace(/"/g,''));

      if (!cols[regionIdx]?.includes('인천')) {
        return processRow(i + 1);
      }

      const keyword  = cols[regionIdx] + " " + cols[nameIdx];
      const winCount = cols[winIdx] || "0";

      ps.keywordSearch(keyword, function(data, status) {

        if (status === kakao.maps.services.Status.OK) {
          const lat  = data[0].y;
          const lng  = data[0].x;
          const name = data[0].place_name;

          const marker = new kakao.maps.Marker({
            map: map,
            position: new kakao.maps.LatLng(lat, lng),
            title: name
          });

          const infowindow = new kakao.maps.InfoWindow({
            content: `<div style="padding:5px;">
              <strong>${name}</strong><br>
              1등 자동 당첨: ${winCount}회
            </div>`
          });

          kakao.maps.event.addListener(marker, 'click', function() {
            infowindow.open(map, marker);
          });
        }

        // API 호출 제한 방지용 딜레이
        setTimeout(() => processRow(i + 1), 300);
      });
    }

    processRow(0);
  });
