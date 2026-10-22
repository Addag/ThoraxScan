select *
from public.legal_consents
order by created_at desc;

select has_table_privilege(
  'authenticated',
  'public.legal_consents',
  'select'
);

select has_function_privilege(
  'authenticated',
  'public.record_registration_consents(text)',
  'execute'
);