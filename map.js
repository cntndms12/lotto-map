var container = document.getElementById('map');
var tableBody = document.querySelector('#storeTable tbody');

var currentOverlay = null;

var options = {
  center: new kakao.maps.LatLng(36.5, 127.7),
  level: 12 // 전국 축소
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

    let data = lines.slice(1)
      .map(line => {
        const cols = line.split(',').map(c => c.replace(/"/g,''));
        return {
          region: cols[regionIdx],
          name: cols[nameIdx],
          win: parseInt(cols[winIdx] || "0", 10)
        };
      })
      .filter(d => d.region && (d.region.includes('인천') || d.region.includes('부산')));

	//목록 정렬
    data.sort((a, b) => {
      if (b.win !== a.win) return b.win - a.win;
      return a.name.localeCompare(b.name, 'ko');
    });

    const ps = new kakao.maps.services.Places();
    let bounds = new kakao.maps.LatLngBounds();

    // 모든 검색 Promise 처리
    const searchPromises = data.map((row,i) => {
      return new Promise(resolve => {
        const keyword = row.region + " " + row.name;
        ps.keywordSearch(keyword, function(result, status) {
          if (status === kakao.maps.services.Status.OK) {
            const place = result[0];
            const position = new kakao.maps.LatLng(place.y, place.x);

            // 마커 생성
            const marker = new kakao.maps.Marker({ map, position });

            // 오버레이
            const overlay = new kakao.maps.CustomOverlay({
              position: position,
              content: `
                <div style="display:flex;flex-direction:column;align-items:center;">
                  <div style="
                    padding:10px 14px;
                    font-size:15px;
                    line-height:1.5;
                    font-family:'Malgun Gothic','맑은 고딕',sans-serif;
                    text-align:center;
                    white-space:nowrap;
                    background:white;
                    border-radius:6px;
                    box-shadow:0 2px 6px rgba(0,0,0,0.25);
                  ">
                    <strong>${place.place_name}</strong><br/>
                    1등 자동 ${row.win}회
                  </div>
                  <div style="
                    width:0;
                    height:0;
                    border-left:7px solid transparent;
                    border-right:7px solid transparent;
                    border-top:10px solid white;
                  "></div>
                </div>
              `,
              xAnchor: 0.5,
              yAnchor: 1.35
            });

            kakao.maps.event.addListener(marker, 'click', function() {
              if(currentOverlay) currentOverlay.setMap(null);
              overlay.setMap(map);
              currentOverlay = overlay;
            });

            // 표 row 생성
            const tr = document.createElement('tr');
            tr.style.cursor = "pointer";

            const tdIndex  = document.createElement('td');
            const tdName   = document.createElement('td');
            const tdRegion = document.createElement('td');
            const tdWin    = document.createElement('td');

            tdIndex.textContent  = i + 1;
            tdName.textContent   = place.place_name;
            tdRegion.textContent = row.region;
            tdWin.textContent    = row.win;

            tdIndex.style.textAlign = tdWin.style.textAlign = "center";

            tr.appendChild(tdIndex);
            tr.appendChild(tdName);
            tr.appendChild(tdRegion);
            tr.appendChild(tdWin);

            tr.onclick = function() {
              if(currentOverlay) currentOverlay.setMap(null);
              map.panTo(position);
              overlay.setMap(map);
              currentOverlay = overlay;
            };

            tableBody.appendChild(tr);

            bounds.extend(position); // bounds 확장
            resolve();
          } else resolve();
        });
      });
    });

    // 모든 검색 완료 후 bounds 적용 (전국 보기)
    Promise.all(searchPromises).then(() => {
      map.setBounds(bounds);
    });

  });
