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
    const nameIdx = headers.findIndex(h => h.includes('상호'));
    const regionIdx = headers.findIndex(h => h.includes('지역'));

    console.log(headers, nameIdx, regionIdx);

    const ps = new kakao.maps.services.Places();
    const rows = lines.slice(1);

    function processRow(i) {
      if (i >= rows.length) return;

      const cols = rows[i].split(',').map(c => c.replace(/"/g,''));
      if (!cols[regionIdx]?.includes('인천')) return processRow(i+1);

      const keyword = cols[regionIdx] + " " + cols[nameIdx];
      console.log("검색:", keyword);

      ps.keywordSearch(keyword, function(data, status) {
        console.log(keyword, status);

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

        setTimeout(() => processRow(i+1), 300); // 0.3초 딜레이
      });
    }

    processRow(0);
  });
