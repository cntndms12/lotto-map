var container = document.getElementById('map');
var listContainer = document.getElementById('list');

var currentInfowindow = null;

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

          const position = new kakao.maps.LatLng(lat, lng);

          const marker = new kakao.maps.Marker({
            map: map,
            position: position,
            title: name
          });

          const infowindow = new kakao.maps.InfoWindow({
            content: `
              <div style="
                padding:8px;
                text-align:center;
                font-size:13px;
                line-height:1.4;
              ">
                <strong>${name}</strong><br/>
                1등 자동 당첨 ${winCount}회
              </div>
            `
          });

          kakao.maps.event.addListener(marker, 'click', function() {
            if (currentInfowindow) {
              currentInfowindow.close();
            }
            infowindow.open(map, marker);
            currentInfowindow = infowindow;
          });

          const item = document.createElement('div');
          item.style.padding = "8px";
          item.style.borderBottom = "1px solid #eee";
          item.style.cursor = "pointer";
          item.innerHTML = `<strong>${name}</strong><br>1등 자동: ${winCount}회`;

          item.onclick = function() {
            if (currentInfowindow) {
              currentInfowindow.close();
            }
            map.panTo(position);
            infowindow.open(map, marker);
            currentInfowindow = infowindow;
          };

          listContainer.appendChild(item);
        }

        setTimeout(() => processRow(i + 1), 300);
      });
    }

    processRow(0);
  });
