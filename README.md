**BLN - IP & Product Management**
echo # BLN - IP Address & Contract Management > README.md <br>
echo .venv/ >> .gitignore<br>
echo \__pycache__/ >> .gitignore<br>
echo node_modules/ >> .gitignore<br>
echo .env >> .gitignore<br>
git add .<br>
git commit -m "Initial commit: Repository setup"<br>
git push -u origin main<br>
<br>
pip install django djangorestframework djangorestframework-simplejwt django-cors-headers python-dotenv mysqlclient<br>
create database bln character set utf8 collate utf8_general_ci;<br>
django-admin startproject core .<br>
the . to tell don't create an extra root folder. Drop manage.py right here where I am

***create .env to secure db access update settings.py accordingly***
<br>
DEBUG=True<br>
SECRET_KEY=your_secret_key<br>
DB_NAME=bln<br>
DB_USER=your_db_user<br>
DB_PASSWORD=your_db_pwd<br>
DB_HOST=something.mydomain.com<br>
DB_PORT=3306<br>

***reverse engineering***
python manage.py inspectdb<br>

class Customers(models.Model):<br>
    id = models.IntegerField(primary_key=True)<br>
    customer_name = models.CharField(unique=True, max_length=64, blank=True, null=True)<br>
.<br>
.<br>
.<br>
    class Meta:<br>
        managed = False #so Django doesn't manage the db structure<br>






