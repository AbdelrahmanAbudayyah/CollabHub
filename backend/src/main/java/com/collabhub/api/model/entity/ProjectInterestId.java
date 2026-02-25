package com.collabhub.api.model.entity;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * Composite primary key for ProjectInterest.
 *
 * JPA requires composite keys to:
 *   1. Implement Serializable
 *   2. Override equals() and hashCode()
 *   3. Have a no-arg constructor
 *
 * Lombok's @EqualsAndHashCode generates equals/hashCode based on
 * both fields, so two keys with the same userId + projectId are equal.
 */
@NoArgsConstructor
@AllArgsConstructor
@EqualsAndHashCode
public class ProjectInterestId implements Serializable {
    private Long user;
    private Long project;
}
