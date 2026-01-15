var container = document.getElementById('map');
var tableBody = document.querySelector('#storeTable tbody');

var currentOverlay = null;

var options = {
  center: new kakao.maps.LatLng(36.5, 127.7),
  level: 12 // 전국 축소
};
var map = new kakao.maps.Map(container, options);

var markers = []; // 클러스터링용 마커 배열
// 클러스터러 생성
var clusterer = new kakao.maps.MarkerClusterer({
    map: map,
    averageCenter: true,      // 클러스터 중심 위치 계산
    minLevel: 10,             // 이 레벨 이상이면 클러스터 풀림
    gridSize: 60,
    disableClickZoom: false,  // 클릭하면 줌 확대
    styles: [
        {
            width: '45px',
            height: '45px',
            background: '#238CFA',
            color: 'white',
            textAlign: 'center',
            borderRadius: '50%',
            lineHeight: '45px',
            fontSize: '15px',
            fontWeight: 'bold',
            border: '2px solid white',
            boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
        },
        {
            width: '55px',
            height: '55px',
            background: '#238CFA',
            color: 'white',
            textAlign: 'center',
            borderRadius: '50%',
            lineHeight: '55px',
            fontSize: '16px',
            fontWeight: 'bold',
            border: '2px solid white'
        }
    ]
});
// 클러스터 클릭 이벤트 (원하면 줌 레벨을 2만큼 올려서 확대)
kakao.maps.event.addListener(clusterer, 'clusterclick', function(cluster) {
    var level = map.getLevel();            // 현재 지도 레벨
    map.setLevel(level - 2, { animate: true }); // 2레벨 확대
    map.setCenter(cluster.getCenter());    // 클릭한 클러스터 중심으로 이동
});

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

	// 중복 제거 (상호+지역+당첨 동일시 제거)
    let seen = new Set();
    data = data.filter(d => {
      const key = d.name + '|' + d.region + '|' + d.win;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

    // 정렬: 1등 내림차순, 같으면 상호명 가나다순
    data.sort((a,b) => {
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
            const marker = new kakao.maps.Marker({ position });
            markers.push(marker); // 클러스터에 추가

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

            tdIndex.textContent  = tableBody.children.length + 1; // 무조건 순서대로
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
			  overlay.setMap(map);
			  currentOverlay = overlay;
			  
			  // 모바일이면 목록 닫기
			  if(window.innerWidth <= 768){
				const layout = document.getElementById('layout');
				layout.classList.remove('show-list');

				const toggleBtn = document.getElementById('toggleListBtn');
				toggleBtn.textContent = '📋 목록 보기';
			  }

			  // 줌 레벨 설정 (더 가까이 보기)
			  const currentLevel = map.getLevel(); // 현재 레벨
			  const targetLevel = Math.min(currentLevel, 7); // 7 정도로 확대, 기존보다 가까움
			  map.setLevel(targetLevel, { animate: true }); // 애니메이션으로 확대
			  
			  setTimeout(() => {
				map.panTo(position);
			  }, 250); // 0.25초 정도 딜레이
			};

            tableBody.appendChild(tr);

            bounds.extend(position); // bounds 확장
            resolve();
          } else resolve();
        });
      });
    });

    Promise.all(searchPromises).then(() => {
      map.setBounds(bounds);
      clusterer.addMarkers(markers); // 모든 마커 클러스터링
    });
  });
