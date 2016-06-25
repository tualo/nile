select
  osm_type,
  osm_id,
  class,
  type,
  admin_level,
  rank_search,
  rank_address,
  min(place_id) as place_id,
  min(parent_place_id) as parent_place_id,
  calculated_country_code as country_code,
  get_address_by_language(place_id, {languagePrefArraySQL}) as langaddress,
  get_name_by_language(name, {languagePrefArraySQL}) as placename,
  get_name_by_language(name, ARRAY['ref']) as ref,
  avg(ST_X(centroid)) as lon,
  avg(ST_Y(centroid)) as lat,
  {importanceSQL}
  coalesce(importance,0.75-(rank_search::float/40)) as importance,
  (
    select
      max(p.importance*(p.rank_address+2))
    from place_addressline s, placex p
    where
      s.place_id = min(CASE WHEN placex.rank_search < 28 THEN placex.place_id ELSE placex.parent_place_id END) and
      p.place_id = s.address_place_id and
      s.isaddress and
      p.importance is not null
  ) as addressimportance,
  (extratags->'place') as extra_place
from
  placex
where
  place_id in ( {placeIDs} )
  and (placex.rank_address between {minAddressRank}
  and {maxAddressRank})
  <if term="between(14,minAddressRank,maxAddressRank)">
    or (extratags->'place') = 'city'
  </if>

  <if term="isset(addressRankList)">
  or placex.rank_address in ( {addressRankList} )
  </if>
  <if term="isset(allowedTypesSQLList)">
  or placex.class in ( {allowedTypesSQLList })
  </if>
  and linked_place_id is null
group by
  osm_type,
  osm_id,
  class,
  type,
  admin_level,
  rank_search,
  rank_address,
  calculated_country_code,
  importance {gDeDupe}
  ,langaddress
  ,placename
  ,ref
  ,extratags->'place'

<if term="between(30,minAddressRank,maxAddressRank)">
  union
  select 'T' as osm_type,
    place_id as osm_id,
    'place' as class,
    'house' as type,
    null as admin_level,
    30 as rank_search,
    30 as rank_address,
    min(place_id) as place_id,
    min(parent_place_id) as parent_place_id,
    'us' as country_code,
    get_address_by_language(place_id,{languagePrefArraySQL} ) as langaddress,
    null as placename,
    null as ref,
    avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat,
    {importanceSQL}-1.15 as importance,
    (
      select max(p.importance*(p.rank_address+2))
      from place_addressline s, placex p
      where s.place_id = min(location_property_tiger.parent_place_id)
      and p.place_id = s.address_place_id and s.isaddress
      and p.importance is not null
    ) as addressimportance,

    null as extra_place
  from location_property_tiger
  where
    place_id in ({placeIDs})
    and 30 between {minAddressRank} and {maxAddressRank}
  group by place_id {gDeDupe}
  union
  select
    'L' as osm_type,
    place_id as osm_id,
    'place' as class,
    'house' as type,
    null as admin_level,
    30 as rank_search,
    30 as rank_address,
    min(place_id) as place_id,
    min(parent_place_id) as parent_place_id,
    'us' as country_code,
    get_address_by_language(place_id, {languagePrefArraySQL}) as langaddress,
    null as placename,
    null as ref,
    avg(ST_X(centroid)) as lon,avg(ST_Y(centroid)) as lat,
    {importanceSQL}-1.10 as importance,
    (
      select
        max(p.importance*(p.rank_address+2))
      from
        place_addressline s, placex p
      where
      s.place_id = min(location_property_aux.parent_place_id) and
      p.place_id = s.address_place_id and s.isaddress and
      p.importance is not null
    ) as addressimportance,
    null as extra_place
  from
    location_property_aux
  where
    place_id in ({placeIDs})
    and 30 between {minAddressRank} and {maxAddressRank}
  group by
    place_id {gDeDupe}
    ,get_address_by_language(place_id, {languagePrefArraySQL})
</if>
order by importance desc
