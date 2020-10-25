class UserController{

    constructor(formIdCreate, formIdUptadeEl, tableId){

        this.formEl = document.getElementById(formIdCreate);
        this.formIdUptadeEl = document.getElementById(formIdUptadeEl);
        this.tableEl = document.getElementById(tableId);

        this.onSubmit();
        this.onEdit();
        this.selectAll();
    }

    onEdit(){

        document.querySelector('#box-user-uptade .btn-cancel').addEventListener('click', event=>{

        this.showPainelCreate();

        });

        this.formIdUptadeEl.addEventListener('submit', event =>{

            event.preventDefault();

            let btn = this.formIdUptadeEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formIdUptadeEl);

            let index = this.formIdUptadeEl.dataset.trIndex;

            let tr = this.tableEl.rows[index];

            let userOld = JSON.parse(tr.dataset.user);

            let result = Object.assign({}, userOld, values);

            this.getPhoto(this.formIdUptadeEl).then((content)=>{

                if(!values.photo){
                    result._photo = userOld._photo;
                }else{
                    result._photo = content;
                }

                let user = new User();

                user.loadFromJSON(result);

                user.save();

                this.getTr(user, tr);

                this.uptadeCount();

                this.formIdUptadeEl.reset();

                this.showPainelCreate();

                btn.disabled = false;

            }, (e)=>{

                console.error(e);

            });

        });

    }

    onSubmit(){

        this.formEl.addEventListener('submit', event =>{

            event.preventDefault();

            let btn = this.formEl.querySelector("[type=submit]");

            btn.disabled = true;

            let values = this.getValues(this.formEl);

            if (!values) return false;

            this.getPhoto(this.formEl).then((content)=>{

                values.photo = content;

                values.save();

                this.addLine(values);

                this.formEl.reset();

                btn.disabled = false;

            }, (e)=>{

                console.error(e);

            });     
        });

    }

    getPhoto(formEl){

        return new Promise((resolve, reject)=>{

            let fileReader = new FileReader();

            let elements = [...formEl.elements].filter(item =>{

            if (item.name === 'photo'){
                return item;
            }
        });
        
        let file = elements[0].files[0];

        fileReader.onload = ()=>{

            resolve(fileReader.result);

        }

        fileReader.onerror = ()=>{

             reject(e);
        }

        if (file){

            fileReader.readAsDataURL(file);

        } else{

            resolve('dist/img/boxed-bg.jpg');
        }

        });
    }

    getValues(formEl){

        let user = {};

        let isValid = true;

        [...formEl.elements].forEach(function (filds, index){

            if (['name', 'email', 'password'].indexOf(filds.name) > -1 && !filds.value){

                filds.parentElement.classList.add('has-error');
                isValid = false;

            }

            if(filds.name == 'gender'){
        
                if(filds.checked){
        
                    user[filds.name] = filds.value;
        
                }
        
            } else if (filds.name == "admin") {

                user[filds.name] = filds.checked;

            }else{
        
                user[filds.name] = filds.value;
                
        
            }
        
        });

        if (!isValid){

            return false;
            
        }

        return new User(
            user.name,
            user.gender,
            user.birth, 
            user.country, 
            user.email, 
            user.password, 
            user.photo, 
            user.admin
        );

    }

    selectAll(){

        let users = User.getUsersStorage();

        users.forEach(dataUser =>{

            let user = new User();

            user.loadFromJSON(dataUser);

            this.addLine(user);
        });
    }

    addLine(dataUser){ // adiciona uma nova linha com as info do usuario.

        let tr = this.getTr(dataUser);
        
        this.tableEl.appendChild(tr);

        this.uptadeCount();
    
    }

    getTr(dataUser, tr = null){ // cria a tr, com as info do usuario.

        if(tr === null) tr = document.createElement('tr');

        tr.dataset.user = JSON.stringify(dataUser);

        tr.innerHTML = 
        `<td><img src="${dataUser.photo}" alt="User Image" class="img-circle img-sm"></td>
        <td>${dataUser.name}</td>
        <td>${dataUser.email}</td>
        <td>${(dataUser.admin) ? 'Sim' : 'Não'}</td>
        <td>${Utils.dateFormat(dataUser.register)}</td>
        <td>
        <button type="button" class="btn btn-primary btn-edit btn-xs btn-flat">Editar</button>
        <button type="button" class="btn btn-danger btn-delete btn-xs btn-flat">Excluir</button>
        </td>`

        this.addEventsTr(tr);

        return tr;
    }

    addEventsTr(tr){ // metodo para excluir o usuario, em seguida atualiza o numero de usuarios.

        tr.querySelector('.btn-delete').addEventListener('click', event=>{

            if(confirm("Deseja realmente excluir ?")){

                let user = new User();

                user.loadFromJSON(JSON.parse(tr.dataset.user));

                user.remove();

                tr.remove();

                this.uptadeCount();

            }

        });

        tr.querySelector('.btn-edit').addEventListener('click', event=>{ // metodo para o o botão editar.

            let json =  JSON.parse(tr.dataset.user);

            this.formIdUptadeEl.dataset.trIndex = tr.sectionRowIndex;

            for (let name in json){

                let fild = this.formIdUptadeEl.querySelector("[name="+ name.replace("_", "") +  "]");                

                if (fild){

                    switch(fild.type){
                        
                        case 'file':
                        continue;
                        break;

                        case 'radio':
                            fild = this.formIdUptadeEl.querySelector("[name="+ name.replace("_", "") + "][value="+ json[name] + "]");
                            fild.checked = true;
                        break;

                        case 'checkbox':
                            fild.checked = json[name];
                        break;

                        default:
                            fild.value = json[name];

                    }

                }
            }

            this.formIdUptadeEl.querySelector('.photo').src = json._photo;

            this.showPainelUptade();

        });
    }

    showPainelCreate(){ // mostra o painel para criar novos usuario e oculta o editar usuarios.

        document.querySelector('#box-user-create').style.display = 'block';
        document.querySelector('#box-user-uptade').style.display = 'none';

    }

    showPainelUptade(){ // mostra o painel editar usuario e oculta o criar novos usuarios.

        document.querySelector('#box-user-create').style.display = 'none';
        document.querySelector('#box-user-uptade').style.display = 'block';

    }

    uptadeCount(){ // atualiza o numeros de usuarios cadastrados e numero de usuarios admin.

        let numberUsers = 0;
        let numberAdmin = 0;

        [...this.tableEl.children].forEach(tr=>{

            numberUsers++;

            let user = JSON.parse(tr.dataset.user);

            if(user._admin) numberAdmin++;

        });

        document.querySelector('#number-users').innerHTML = numberUsers;
        document.querySelector('#number-users-admin').innerHTML = numberAdmin;
    }

}