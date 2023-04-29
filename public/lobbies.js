let createLoby = document.getElementById('create-form')
let joinLoby = document.getElementById('join-form')
let lobyId = -1

createLoby.addEventListener('submit', () =>{
    lobyId = Math.floor(10000 + Math.random() * 90000);
    sessionStorage.setItem('lobyId', lobyId)
    sessionStorage.setItem('createLoby', true)   
})

joinLoby.addEventListener('submit', () => {
    let joinId = document.getElementById('lobyCode').value
    sessionStorage.setItem('lobyId', joinId)
    sessionStorage.setItem('createLoby', false)   

})