This is a notetaker application that uses Github Oauth to deal with user authentication and Tanstack quey to sync data with backend. To get it running make sure to add the required environemnt varibles to your .env file:

  DATABASE_URL: [ 'Required' ],
  NEXTAUTH_URL: [ 'Required' ],
  GITHUB_CLIENT_ID: [ 'Required' ],
  GITHUB_CLIENT_SECRET: [ 'Required' ]


To set this up be sure to follow GH OAUTH setup(https://docs.github.com/en/apps/oauth-apps/building-oauth-apps/authorizing-oauth-apps). 
Also set up a postgres db to store the data and add it to the secret on your .env (DATABASE_URL).
