# english_learn_app
English learning app based on Langchain and LangGraph

# BACK
## Postgresql
Para persistir conversaciones y guardar otra información como vocabulario. Se despliega con supabase.
pip install supabase

postgresql://postgres:[YOUR-PASSWORD]@db.iubtttjvqjidxhrhrdcl.supabase.co:5432/postgres

## Redis
Para cache, estado en la conversación.
docker run -d -p 6379:6379 redis
pip intsall redis
pip install langgraph-checkpoint-redis

## Run 
uvicorn main:app --reload --port 8000

# FRONT
npx expo install --fix
npm install
npx expo install expo-asset
npx expo install react-native-web react-dom @expo/metro-runtime
npx expo start --clear


Este no se: npm install expo-router@~6.0.23 expo-status-bar@~3.0.9 react-native@0.81.5 react-native-screens@~4.16.0 react-native-worklets@0.5.1 @types/react@~19.1.10 --legacy-peer-deps

### Eliminar paquetes previos
1. Borra todo lo viejo (muy importante después de cambiar SDK)
rm -rf node_modules
rm -f package-lock.json

2. Reinstala las dependencias
npm install

3. Deja que Expo actualice todas las dependencias compatibles con SDK 54
npx expo install --fix

4. Instala las cosas específicas que tu proyecto necesita
npx expo install expo-asset react-native-web react-dom @expo/metro-runtime

5. Verifica que todo esté correcto
npx expo-doctor

# NGINX
sudo apt install nginx
nano /etc/nginx/sites-available/english_learn
sudo unlink /etc/nginx/sites-enabled/default
sudo ln -s /etc/nginx/sites-available/english_learn /etc/nginx/sites-enabled/english_learn
sudo nginx -s
sudo nginx -s reload

sudo tail -f /var/log/nginx/access.log
server {
    listen 80;
    server_name localhost;

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}