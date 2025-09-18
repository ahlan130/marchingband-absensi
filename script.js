// DOM Elements
const form = document.getElementById('absensiForm');
const statusDiv = document.getElementById('status');
const locationSpan = document.getElementById('currentLocation');

// Simpan data absensi ke localStorage (backup)
let absensiList = JSON.parse(localStorage.getItem('marchingband_absensi')) || [];

// Ambil lokasi saat ini (GPS + reverse geocoding)
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`;
      fetch(url)
        .then(res => res.json())
        .then(data => {
          const lokasi = data.display_name || `${latitude}, ${longitude}`;
          locationSpan.textContent = lokasi;
          console.log("Lokasi berhasil didapatkan:", lokasi);
        })
        .catch(err => {
          locationSpan.textContent = `${latitude}, ${longitude}`;
          console.error("Error geocoding:", err);
        });
    },
    (err) => {
      locationSpan.textContent = "GPS tidak aktif atau ditolak";
      console.warn("GPS Error:", err.message);
    }
  );
} else {
  locationSpan.textContent = "Browser tidak mendukung GPS";
}

// Proses submit form
form.addEventListener('submit', (e) => {
  e.preventDefault();

  const name = document.getElementById('name').value.trim();
  const photoInput = document.getElementById('photo');
  const photoFile = photoInput.files[0];

  if (!name || !photoFile) {
    statusDiv.innerHTML = '<span style="color: #ff6b6b;">❌ Silakan isi semua bagian!</span>';
    return;
  }

  const reader = new FileReader();
  reader.onload = async () => {
    const photoBase64 = reader.result;

    // Data absensi
    const absensi = {
      nama: name,
      foto: photoBase64,
      lokasi: locationSpan.textContent,
      tanggal: new Date().toLocaleString('id-ID'),
    };

    // Simpan ke localStorage (backup)
    absensiList.unshift(absensi);
    localStorage.setItem('marchingband_absensi', JSON.stringify(absensiList));

    // Kirim ke Google Apps Script Web App
    try {
      const response = await fetch("https://script.google.com/macros/s/AKfycbxGXaP9E3FckUgGzDb-Y38LaDSJKV2tEtqiLIFP-Fg/exec", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name,
          location: locationSpan.textContent,
          photoBase64: photoBase64,
          filename: photoFile.name
        })
      });

      const result = await response.json();
      if (result.error) {
        statusDiv.innerHTML = `<span style="color: #ff6b6b;">⚠️ Gagal menyimpan ke Google Sheet: ${result.error}</span>`;
      } else {
        statusDiv.innerHTML = `<span style="color: #d0ff6a;">✅ Absensi berhasil! Data tersimpan di Sheet & Drive.</span>`;
      }
    } catch (err) {
      console.error("Error fetch:", err);
      statusDiv.innerHTML = `<span style="color: #ff6b6b;">⚠️ Gagal mengirim ke server. Data tetap tersimpan di local.</span>`;
    }

    form.reset();
    setTimeout(() => statusDiv.innerHTML = '', 5000);
  };
  reader.readAsDataURL(photoFile);
});
