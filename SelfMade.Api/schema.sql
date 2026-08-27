-- SelfMade — схема базы данных PostgreSQL.
-- Снимок реальной схемы, с которой работает Infrastructure/AppDbContext.cs.
-- Миграций EF Core в проекте нет — накатите этот файл на пустую базу, чтобы поднять окружение:
--   psql -U postgres -d selfmade -f schema.sql

SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;

SET default_tablespace = '';
SET default_table_access_method = heap;

--
-- users
--

CREATE TABLE public.users (
    id integer NOT NULL,
    username character varying(50) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

CREATE SEQUENCE public.users_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.users_id_seq OWNED BY public.users.id;
ALTER TABLE ONLY public.users ALTER COLUMN id SET DEFAULT nextval('public.users_id_seq'::regclass);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);

--
-- categories
--

CREATE TABLE public.categories (
    id integer NOT NULL,
    name character varying(50) NOT NULL,
    type character varying(50) NOT NULL,
    description text,
    user_id integer
);

CREATE SEQUENCE public.categories_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.categories_id_seq OWNED BY public.categories.id;
ALTER TABLE ONLY public.categories ALTER COLUMN id SET DEFAULT nextval('public.categories_id_seq'::regclass);
ALTER TABLE ONLY public.categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);

--
-- user_interests (глобальные интересы/цели)
--

CREATE TABLE public.user_interests (
    id integer NOT NULL,
    user_id integer,
    category_id integer,
    title character varying(150) NOT NULL,
    is_development_goal boolean DEFAULT false NOT NULL
);

CREATE SEQUENCE public.user_interests_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.user_interests_id_seq OWNED BY public.user_interests.id;
ALTER TABLE ONLY public.user_interests ALTER COLUMN id SET DEFAULT nextval('public.user_interests_id_seq'::regclass);
ALTER TABLE ONLY public.user_interests ADD CONSTRAINT user_interests_pkey PRIMARY KEY (id);

--
-- activity_logs
--

CREATE TABLE public.activity_logs (
    id integer NOT NULL,
    user_id integer,
    title character varying(200) NOT NULL,
    duration_minutes integer NOT NULL,
    is_productive boolean NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    category_id integer,
    description text
);

CREATE SEQUENCE public.activity_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.activity_logs_id_seq OWNED BY public.activity_logs.id;
ALTER TABLE ONLY public.activity_logs ALTER COLUMN id SET DEFAULT nextval('public.activity_logs_id_seq'::regclass);
ALTER TABLE ONLY public.activity_logs ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);

--
-- mood_logs
--

CREATE TABLE public.mood_logs (
    id integer NOT NULL,
    user_id integer,
    note text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    score integer DEFAULT 3 NOT NULL
);

CREATE SEQUENCE public.mood_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.mood_logs_id_seq OWNED BY public.mood_logs.id;
ALTER TABLE ONLY public.mood_logs ALTER COLUMN id SET DEFAULT nextval('public.mood_logs_id_seq'::regclass);
ALTER TABLE ONLY public.mood_logs ADD CONSTRAINT mood_logs_pkey PRIMARY KEY (id);

--
-- ai_recommendations (шаги плана от ИИ по конкретной цели)
--

CREATE TABLE public.ai_recommendations (
    id integer NOT NULL,
    user_id integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    goal_id integer,
    title text DEFAULT ''::text NOT NULL,
    description text DEFAULT ''::text NOT NULL,
    status text DEFAULT 'Assigned'::text NOT NULL,
    completed_at timestamp without time zone
);

CREATE SEQUENCE public.ai_recommendations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.ai_recommendations_id_seq OWNED BY public.ai_recommendations.id;
ALTER TABLE ONLY public.ai_recommendations ALTER COLUMN id SET DEFAULT nextval('public.ai_recommendations_id_seq'::regclass);
ALTER TABLE ONLY public.ai_recommendations ADD CONSTRAINT ai_recommendations_pkey PRIMARY KEY (id);

--
-- user_profiles
--

CREATE TABLE public.user_profiles (
    id integer NOT NULL,
    user_id integer NOT NULL,
    current_level text,
    free_time_start time without time zone NOT NULL,
    sleep_time time without time zone NOT NULL,
    preferred_rest text NOT NULL,
    disliked_rest text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    focused_goal_id integer,
    learning_track text DEFAULT ''::text NOT NULL,
    free_time_end time without time zone DEFAULT '22:00:00'::time without time zone NOT NULL
);

CREATE SEQUENCE public.user_profiles_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

ALTER SEQUENCE public.user_profiles_id_seq OWNED BY public.user_profiles.id;
ALTER TABLE ONLY public.user_profiles ALTER COLUMN id SET DEFAULT nextval('public.user_profiles_id_seq'::regclass);
ALTER TABLE ONLY public.user_profiles ADD CONSTRAINT user_profiles_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_profiles ADD CONSTRAINT user_profiles_user_id_key UNIQUE (user_id);

--
-- Внешние ключи
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT fk_activity_category FOREIGN KEY (category_id) REFERENCES public.categories(id);

ALTER TABLE ONLY public.ai_recommendations
    ADD CONSTRAINT ai_recommendations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.mood_logs
    ADD CONSTRAINT mood_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.user_interests
    ADD CONSTRAINT user_interests_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.user_profiles
    ADD CONSTRAINT fk_user_profiles_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
