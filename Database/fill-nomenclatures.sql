DO
$$
    DECLARE
        _unit         bigint;
        _product_type bigint;
    BEGIN
        SELECT units.id INTO _unit FROM units LIMIT 1;
        SELECT product_types.id INTO _product_type FROM product_types LIMIT 1;
        INSERT INTO nomenclatures(designation, name, unit, product_type)
            (SELECT concat(floor(random() * 900) + 100, '.', floor(random() * 900) + 100, '.', floor(random() * 900) + 100), 'Тест', _unit, _product_type
             FROM generate_series(1, 1000));
    END
$$ LANGUAGE plpgsql;