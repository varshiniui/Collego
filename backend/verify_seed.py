import os
from collections import Counter
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()
sb = create_client(os.environ['SUPABASE_URL'], os.environ['SUPABASE_KEY'])

r = sb.table('colleges').select(
    'name,category,state,admission_basis,typical_rank_cutoff,min_cutoff_percentage'
).eq('name', 'IIT Madras').execute()
print('IIT Madras:', r.data)

r2 = sb.table('colleges').select('id', count='exact').execute()
print('Total colleges:', r2.count)

r3 = sb.table('colleges').select('category').execute()
print('By category:', Counter(row['category'] for row in r3.data))

r4 = sb.table('colleges').select('state').eq('category', 'Management').execute()
print('Management colleges by state:', Counter(row['state'] for row in r4.data))