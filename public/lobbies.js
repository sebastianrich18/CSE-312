let createLoby = document.getElementById('create-form')

createLoby.addEventListener('submit', (e) =>{
    e.preventDefault()
    const lobyId = Math.floor(10000 + Math.random() * 90000);
    const data = {lobyCode: lobyId}
    const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      };
    fetch('/api/lobydata', options)
    .then(response => response.json())
    .then(res => console.log(res))
    

})
