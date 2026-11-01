-- A recognised utm_source decides the channel ahead of the referrer, except for navigation inside the site.
-- utm_source_category is the channel the utm_source names, or '' when it names none (unknown, or only 'other').

ALTER TABLE analytics.events
    ADD COLUMN IF NOT EXISTS utm_source_category String ALIAS
        if(referrer_source = 'internal' OR utm_source = '', '',
            arrayFirst(medium -> medium IN ('ai', 'search', 'social', 'email'), [
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', lowerUTF8(trimBoth(utm_source)), ''),
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', replaceRegexpOne(lowerUTF8(trimBoth(utm_source)), '^[a-z][a-z0-9+.-]*://', ''))), '')
            ])
        );

ALTER TABLE analytics.events
    MODIFY COLUMN IF EXISTS referrer_source_effective String ALIAS
        coalesce(
            nullIf(utm_source_category, ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', referrer_source_canonical, ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', referrer_url)), ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', referrer_source_name, ''), ''),
            referrer_source
        );

ALTER TABLE analytics.sessions
    ADD COLUMN IF NOT EXISTS utm_source_category String ALIAS
        if(tupleElement(referrer_source, 2) = 'internal' OR tupleElement(utm_source, 2) = '', '',
            arrayFirst(medium -> medium IN ('ai', 'search', 'social', 'email'), [
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', lowerUTF8(trimBoth(tupleElement(utm_source, 2))), ''),
                dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', replaceRegexpOne(lowerUTF8(trimBoth(tupleElement(utm_source, 2))), '^[a-z][a-z0-9+.-]*://', ''))), '')
            ])
        );

ALTER TABLE analytics.sessions
    MODIFY COLUMN IF EXISTS referrer_source_effective String ALIAS
        coalesce(
            nullIf(utm_source_category, ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', tupleElement(referrer_source_canonical, 2), ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', domainWithoutWWW(concat('http://', tupleElement(referrer_url, 2))), ''), ''),
            nullIf(dictGetOrDefault('analytics.referrer_source_categories_dict', 'medium', tupleElement(referrer_source_name, 2), ''), ''),
            tupleElement(referrer_source, 2)
        );
