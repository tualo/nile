CREATE OR REPLACE FUNCTION public.hstore2json (
  hs public.hstore
)
RETURNS text AS
$body$
DECLARE
  rv text;
  r record;
BEGIN
  rv:='';
  for r in (select key, val from each(hs) as h(key, val)) loop
    if rv<>'' then
      rv:=rv||',';
    end if;
    rv:=rv || '"'  || r.key || '":';

    --Perform escaping
    r.val := REPLACE(r.val, E'\\', E'\\\\');
    r.val := REPLACE(r.val, '"', E'\\"');
    r.val := REPLACE(r.val, E'\n', E'\\n');
    r.val := REPLACE(r.val, E'\r', E'\\r');

    rv:=rv || CASE WHEN r.val IS NULL THEN 'null' ELSE '"'  || r.val || '"' END;
  end loop;
  return '{'||rv||'}';
END;
$body$
LANGUAGE 'plpgsql'
IMMUTABLE
CALLED ON NULL INPUT
SECURITY INVOKER
COST 100;
