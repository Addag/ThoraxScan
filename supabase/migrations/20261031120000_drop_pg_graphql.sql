-- The app talks to the database only through PostgREST (.from/.rpc), so the
-- GraphQL endpoint just let any signed-in user list table and column names.
-- Re-enable with `create extension pg_graphql;` if GraphQL is ever needed.
drop extension if exists pg_graphql;
