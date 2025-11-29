# Learning

1.) for pnpm we use "workspace:*" for npm we use only * , * means picking from same package

so as we are using pnpm add this in package.json of both backends after doing "npm init -y"

```
"devDependencies": {
    "@repo/typescript-config": "workspace:*",
}
```
global pnpm install (means we go to the root folder and did pnpm install) is must after changing things in package.json on you own

2.)we created a backend-common folder so that we can export common config things from here for both backends:
<br/>  
i) first we did npm init -y and change the name to @repo/backend-commom in package.json then created a tsconfig.json and pasted the same tsconfig code that is present in both backends ,after that we created "devDependencies" script and pasted the thing from point 1 and added the export script in package.json 
```
"exports":{
    "./config":"./src/config.ts"

  },
```
ii) while importing it in any of the backends we need to edit the devDependencies of that backend's package.json(we need to add that repo name which we want to import), after this we did a global pnpm install 

3.) How to setup prisma :
make a db package , then "pnpm install prisma" , "npx prisma init" , then define your schemas and get a db url paste it in .env , "npx prisma migrate dev --name init_schema" {this command will convert your schema into sql queries and migrate it into form of tables in your database} ,then we have to do "npx prisma generate" and create index.ts in src and export it by using export script in package.json and then import it using "@repo/db" in http-backend package.json as dependecies and not devDependencies, then do global "pnpm install" to sync everything 
NOTE: MOVE PRISMA.CONFIG.TS TO SRC

