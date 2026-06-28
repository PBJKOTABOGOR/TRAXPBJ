/* Tempel di index.html sebelum </body> setelah service-worker.js diupload ke root GitHub Pages */
(function(){
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', function(){
    navigator.serviceWorker.register('./service-worker.js').catch(function(err){
      console.warn('Service worker gagal register:', err);
    });
  });
})();
