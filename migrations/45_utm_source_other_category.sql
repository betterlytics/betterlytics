-- Any utm_source the referrer list knows decides the channel, Other included, not only AI, Search, Social and Email.

ALTER TABLE analytics.events
    MODIFY COLUMN IF EXISTS utm_source_category String ALIAS
        if(referrer_source = 'internal' OR utm_source = '', '',
            arrayFirst(medium -> medium NOT IN ('', 'internal'), [
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', lowerUTF8(trimBoth(utm_source)), ''),
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', replaceRegexpOne(lowerUTF8(trimBoth(utm_source)), '^[a-z][a-z0-9+.-]*://', ''))), '')
            ])
        );

ALTER TABLE analytics.sessions
    MODIFY COLUMN IF EXISTS utm_source_category String ALIAS
        if(tupleElement(referrer_source, 2) = 'internal' OR tupleElement(utm_source, 2) = '', '',
            arrayFirst(medium -> medium NOT IN ('', 'internal'), [
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', lowerUTF8(trimBoth(tupleElement(utm_source, 2))), ''),
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', replaceRegexpOne(lowerUTF8(trimBoth(tupleElement(utm_source, 2))), '^[a-z][a-z0-9+.-]*://', ''))), '')
            ])
        );
