var container = document.getElementById('map');
var tableBody = document.querySelector('#storeTable tbody');

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

    let data = lines.slice(1).map(line => {
      const cols = line.split(',').map(c => c.replace(/"/g,''));
      return {
        region: cols[regionIdx],
        name: cols[nameIdx],
        win: parseInt(cols[winIdx] || "0", 10)
      };
    });

    data = data.filter(d => d.region && d.region.includes('인천'));
    data.sort((a, b) => b.win - a.win);

    const ps = new kakao.maps.services.Places();

    function processRow(i) {
      if (i >= data.length) return;

      const row = data[i];
      const keyword = row.region + " " + row.name;

      ps.keywordSearch(keyword, function(result, status) {
        if (status === kakao.maps.services.Status.OK) {
          const lat  = result[0].y;
          const lng  = result[0].x;
          const name = result[0].place_name;
          const position = new kakao.maps.LatLng(lat, lng);

          const marker = new kakao.maps.Marker({
            map: map,
            position,
            title: name
          });

          const infowindow = new kakao.maps.InfoWindow({
            content: `
              <div style="
                padding:10px;
                text-align:center;
                font-size:15px;
                line-height:1.5;
                font-family:'Malgun Gothic','맑은 고딕',sans-serif;
              ">
                <strong>${name}</strong><br/>
                1등 자동 ${row.win}회
              </div>
            `
          });

          kakao.maps.event.addListener(marker, 'click', function() {
            if (currentInfowindow) currentInfowindow.close();
            infowindow.open(map, marker);
            currentInfowindow = infowindow;
          });

          const tr = document.createElement('tr');
          tr.style.cursor = "pointer";
          tr.innerHTML = `
            <td style="text-align:center;">${i + 1}</td>
            <td>${name}</td>
            <td>${row.region}</td>
            <td style="text-align:center;">${row.win}</td>
          `;

          tr.onclick = function() {
            if (currentInfowindow) currentInfowindow.close();
            map.panTo(position);
            infowindow.open(map, marker);
            currentInfowindow = infowindow;
          };

          tableBody.appendChild(tr);
        }

        setTimeout(() => processRow(i + 1), 300);
      });
    }

    processRow(0);
  });
