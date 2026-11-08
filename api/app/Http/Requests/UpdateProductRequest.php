<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateProductRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->isAdmin() ?? false;
    }

    public function rules(): array
    {
        return [
            'category_id' => [
                'sometimes', 'required', 'integer',
                'exists:categories,id',
            ],
            'name' => [
                'sometimes', 'required',
                'string', 'max:255',
            ],
            'description' => [
                'sometimes', 'required',
                'string', 'max:10000',
            ],
            'price' => [
                'sometimes', 'required', 'numeric',
                'min:0.01', 'max:99999999.99',
                'decimal:0,2',
            ],
            'stock' => [
                'sometimes', 'required', 'integer', 'min:0',
            ],
            'is_active' => [
                'sometimes', 'required', 'boolean',
            ],
            'image' => [
                'sometimes', 'nullable', 'image',
                'mimes:jpg,jpeg,png,webp',
                'max:2048',
            ],
        ];
    }
}
